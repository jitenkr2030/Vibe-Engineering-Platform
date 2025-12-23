# MinIO Bucket Configuration Script
# Run this to initialize the MinIO/S3 bucket

set -e

# Configuration
MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
BUCKET_NAME="${BUCKET_NAME:-vibe-files}"

echo "Configuring MinIO bucket..."

# Install mc if not present
if ! command -v mc &> /dev/null; then
    echo "Installing mc (MinIO client)..."
    curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
    chmod +x /tmp/mc
    MC="/tmp/mc"
else
    MC="mc"
fi

# Add MinIO host configuration
$MC alias set minio http://${MINIO_ENDPOINT} ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# Create bucket if it doesn't exist
if ! $MC ls minio/${BUCKET_NAME} &> /dev/null; then
    echo "Creating bucket: ${BUCKET_NAME}"
    $MC mb minio/${BUCKET_NAME}
    
    # Set bucket policy for public read access to uploaded files
    $MC anonymous set public minio/${BUCKET_NAME}
    
    # Set versioning
    $MC version enable minio/${BUCKET_NAME}
    
    # Create folder structure
    $MC mb minio/${BUCKET_NAME}/projects
    $MC mb minio/${BUCKET_NAME}/avatars
    $MC mb minio/${BUCKET_NAME}/backups
    $MC mb minio/${BUCKET_NAME}/templates
    
    echo "✓ Bucket created and configured!"
else
    echo "✓ Bucket already exists: ${BUCKET_NAME}"
fi

# Set lifecycle policy for backups (delete after 30 days)
cat > /tmp/lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "ID": "DeleteOldBackups",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF

$MC anonymous set-json /tmp/lifecycle.json minio/${BUCKET_NAME} 2>/dev/null || echo "Note: Lifecycle policy not set (may require MinIO Enterprise)"

echo ""
echo "MinIO bucket configuration complete!"
echo "  Endpoint: ${MINIO_ENDPOINT}"
echo "  Bucket: ${BUCKET_NAME}"
echo "  Access Key: ${MINIO_ROOT_USER}"
