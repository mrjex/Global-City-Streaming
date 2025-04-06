



# [COUNTRY] [CITY] [str]


Spain Madrid aeiral view


England London drone footage


England London cityscape





England London cityscape cinematic






"time lapse"





## TODO - Recieved Response from API


Extract from JSON response: `"images.original.mp4"`

Use in app:

```

<video autoplay loop muted playsinline>
  <source src="https://media4.giphy.com/media/l1J3FjsqKuJPzgexW/giphy.mp4" type="video/mp4">
</video>


```




## TODO - Display all .mp4 videos in the same format

Use HTML and CSS classes to force all videos to the same aspect ratio. Ensure that the video fills the box without distortion


CSS Aspect Ratio Box:

<div class="video-container">
  <video autoplay loop muted playsinline>
    <source src="https://media4.giphy.com/media/XYZ/giphy.mp4" type="video/mp4">
  </video>
</div>




.video-container {
  aspect-ratio: 16 / 9; /* Or 4/3, or whatever you prefer */
  width: 100%;          /* Responsive scaling */
  max-width: 500px;     /* Optional: set a max size */
  overflow: hidden;
  border-radius: 12px;  /* Optional: rounded corners */
  background: #000;     /* In case the video doesn't cover the container */
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* This makes it behave like a background image */
  display: block;
}

