async function analyse(req,res) {

    const file = req.file;
  const { latitude, longitude, accuracy, timestamp } = req.body;

  if (!file) return res.status(400).json({ error: 'No image uploaded' });

  console.log('Image:', file.originalname);
  console.log('Latitude:', latitude);
  console.log('Longitude:', longitude);
  console.log('Accuracy:', accuracy);
  console.log('Timestamp:', timestamp);

  res.status(200).json({ message: 'Received image and location' });
}

module.exports = {
    analyse
}                         