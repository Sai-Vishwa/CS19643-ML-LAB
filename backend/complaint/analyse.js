const path = require('path');
const { exec } = require('child_process');
async function analyse(req, res) {
  const file = req.file;
  const { latitude, longitude, accuracy, timestamp } = req.body;

  // Check if the file is uploaded
  if (!file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  console.log('Received file:', file.originalname);
  console.log('Latitude:', latitude);
  console.log('Longitude:', longitude);
  console.log('Accuracy:', accuracy);
  console.log('Timestamp:', timestamp);

  // Send the image buffer to the Python model
  const { buffer } = file;

  // Save the buffer to a temporary file or pass it directly to Python (depending on your setup)
  const tempImagePath = path.join(__dirname, 'temp_image.jpg');
  const fs = require('fs');
  fs.writeFileSync(tempImagePath, buffer);  // Save the buffer as a temporary image file

  // Run Python model (pass the temporary image path to the Python script)
  exec(`python ../../python/train.py "${tempImagePath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Python error:', stderr);
      return res.status(500).json({ error: 'Error in prediction' });
    }

    const result = stdout.trim();
    res.status(200).json({
      message: 'Image and location received',
      prediction: result,
      latitude,
      longitude,
      accuracy,
      timestamp
    });
  });
}

module.exports = {
  analyse
};