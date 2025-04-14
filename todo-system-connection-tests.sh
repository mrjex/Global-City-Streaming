

# Works
kubectl logs -n global-city-streaming flink-processor-86897cd55d-9shfg --tail=50 | cat



# Works
kubectl exec -it flink-processor-86897cd55d-9shfg -n global-city-streaming -- cat /opt/flink/log/flink.out | tail -n 50 | cat


# Works
kubectl exec -it postgres-0 -n global-city-streaming -- psql -U postgres -d postgres -c "SELECT * FROM weather ORDER BY id DESC LIMIT 5;" | cat



# Check number of records in PostgreSQL database
kubectl exec -it postgres-0 -n global-city-streaming -- psql -U postgres -d postgres -c "SELECT COUNT(*) FROM weather;" | cat



# Get all distinct cities from PostgreSQL database
kubectl exec -it postgres-0 -n global-city-streaming -- psql -U postgres -d postgres -c "\pset pager off" -c "SELECT DISTINCT city FROM weather ORDER BY city;" | cat






# Stop all pods - Works or not??
# kubectl scale deployment --all --replicas=0 -n global-city-streaming