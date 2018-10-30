var paparazzi;

paparazzi = new Paparazzi({
  url: "http://192.168.1.12:8080/video"
});

paparazzi.on("update", (image) => {
  return console.log("Downloaded ${image.length} bytes");
});

paparazzi.on('error', (error) => {
  return console.log("Error: ${error.message}");
});

paparazzi.start();
