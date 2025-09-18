
# IMPORTANT:
# 1. Replace the placeholder file paths with actual paths to files on your machine.
# 2. Ensure the server is running before executing this command.

curl -X POST \
  -F "description=Test issue from cURL" \
  -F "type=road_damage" \
  -F "geotag=123 Developer Lane" \
  -F "priority=high" \
  -F "assignedTo={\"id\":\"dev-team\",\"name\":\"Development Team\",\"area\":\"General\"}" \
  -F "images=@/path/to/your/image.jpeg;type=image/jpeg" \
  -F "audio=@/path/to/your/audio.mp3;type=audio/mpeg" \
  {{BASE_URL}}/api/v1/issues