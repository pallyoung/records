package storage

import "time"

// Presigner generates short-lived signed URLs for upload and download.
// Implementations may use Aliyun OSS, S3, or a mock for tests.
type Presigner interface {
	PresignUpload(bucket, objectKey, contentType string, expiresIn time.Duration) (url string, method string, headers map[string]string, err error)
	PresignDownload(bucket, objectKey string, expiresIn time.Duration) (url string, err error)
}

// MockPresigner returns fixed URLs for testing.
type MockPresigner struct {
	UploadURL   string
	DownloadURL string
}

func (m *MockPresigner) PresignUpload(bucket, objectKey, contentType string, expiresIn time.Duration) (url string, method string, headers map[string]string, err error) {
	if m.UploadURL != "" {
		return m.UploadURL, "PUT", map[string]string{"Content-Type": contentType}, nil
	}
	return "https://mock-upload.example/" + bucket + "/" + objectKey, "PUT", map[string]string{"Content-Type": contentType}, nil
}

func (m *MockPresigner) PresignDownload(bucket, objectKey string, expiresIn time.Duration) (url string, err error) {
	if m.DownloadURL != "" {
		return m.DownloadURL, nil
	}
	return "https://mock-download.example/" + bucket + "/" + objectKey + "?sig=test", nil
}
