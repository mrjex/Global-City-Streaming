from redis import Redis, RedisError
import yaml
import json
from typing import Dict, Optional, Any
import os
from pathlib import Path

class CityOverrides:
    def __init__(self):
        self.overrides = self._load_overrides()
        self._watch_overrides_file()
    
    def _load_overrides(self) -> Dict[str, Any]:
        try:
            with open('/app/city-api/config/city-edits.yml', 'r') as f:
                data = yaml.safe_load(f)
                print("Loaded city overrides:", data.get('countries', {}))
                return data.get('countries', {})
        except Exception as e:
            print(f"Error loading city overrides: {str(e)}")
            return {}
    
    def _watch_overrides_file(self):
        """Set up a file watcher for city-edits.yml"""
        import threading
        def watch_file():
            last_mtime = Path('/app/city-api/config/city-edits.yml').stat().st_mtime
            while True:
                try:
                    current_mtime = Path('/app/city-api/config/city-edits.yml').stat().st_mtime
                    if current_mtime != last_mtime:
                        print("Detected changes in city-edits.yml, reloading...")
                        self.overrides = self._load_overrides()
                        last_mtime = current_mtime
                    import time
                    time.sleep(1)
                except Exception as e:
                    print(f"Error watching overrides file: {str(e)}")
                    
        thread = threading.Thread(target=watch_file, daemon=True)
        thread.start()
    
    def get_override(self, country: str, city: str) -> Optional[Dict[str, Any]]:
        key = f"{country}, {city}"
        override = self.overrides.get(key, {})
        if override:
            print(f"Found override for {key}: {override}")
        return override

class RedisCache:
    # TTL constants
    CITY_DATA_TTL = 604800  # 1 week
    VIDEO_DATA_TTL = 604800  # 1 week
    
    def __init__(self):
        self.redis_client = Redis(
            host=os.getenv('REDIS_HOST', 'redis'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.overrides = CityOverrides()
        
    async def get_city_data(self, country: str) -> Optional[Dict[str, Any]]:
        """Get cached city data with TTL check"""
        try:
            cache_key = f"city_data:{country}"
            data = self.redis_client.get(cache_key)
            if data:
                print(f"Cache hit for {cache_key}")
                return json.loads(data)
            print(f"Cache miss for {cache_key}")
            return None
        except Exception as e:
            print(f"Error getting city data from cache: {str(e)}")
            return None

    async def set_city_data(self, country: str, data: Dict[str, Any]) -> bool:
        """Set city data with overrides"""
        try:
            # Apply overrides for each city
            cities = data.get('cities', [])
            for city in cities:
                city_name = city.get('city')
                if city_name:
                    override = self.overrides.get_override(country, city_name)
                    if override:
                        print(f"Applying override for {country}, {city_name}")
                        if 'description' in override:
                            city['description'] = override['description']
            
            cache_key = f"city_data:{country}"
            self.redis_client.setex(
                cache_key,
                self.CITY_DATA_TTL,  # 1 week
                json.dumps(data)
            )
            print(f"Set cache for {cache_key}")
            return True
        except Exception as e:
            print(f"Error setting city data in cache: {str(e)}")
            return False

    async def get_video_data(self, country: str) -> Optional[Dict[str, Any]]:
        """Get cached video data"""
        try:
            cache_key = f"capital_video:{country}"
            data = self.redis_client.get(cache_key)
            if data:
                print(f"Cache hit for {cache_key}")
                return json.loads(data)
            print(f"Cache miss for {cache_key}")
            return None
        except Exception as e:
            print(f"Error getting video data from cache: {str(e)}")
            return None

    async def set_video_data(self, country: str, data: Dict[str, Any]) -> bool:
        """Set video data with overrides"""
        try:
            capital_city = data.get('capital_city')
            if capital_city:
                override = self.overrides.get_override(country, capital_city)
                if override:
                    print(f"Applying video override for {country}, {capital_city}")
                    if override.get('video'):
                        data['video_url'] = override['video']
                    if override.get('description'):
                        data['description'] = override['description']
            
            cache_key = f"capital_video:{country}"
            self.redis_client.setex(
                cache_key,
                self.VIDEO_DATA_TTL,  # 1 week
                json.dumps(data)
            )
            print(f"Set cache for {cache_key}")
            return True
        except Exception as e:
            print(f"Error setting video data in cache: {str(e)}")
            return False

    def clear_cache(self, country: str = None):
        """Clear cache for a country or all cache if country is None"""
        try:
            if country:
                keys = [
                    f"city_data:{country}",
                    f"capital_video:{country}"
                ]
                for key in keys:
                    self.redis_client.delete(key)
                print(f"Cleared cache for {country}")
            else:
                self.redis_client.flushall()
                print("Cleared all cache")
        except Exception as e:
            print(f"Error clearing cache: {str(e)}") 