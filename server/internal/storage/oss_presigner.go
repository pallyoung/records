package storage

import (
	"fmt"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

// OSSPresigner implements Presigner using Aliyun OSS.
// Configure via OSSEndpoint, OSSAccessKeyID, OSSAccessKeySecret; bucket per call or default.
type OSSPresigner struct {
	client *oss.Client
}

// NewOSSPresigner creates a presigner from endpoint and credentials.
// endpoint e.g. "https://oss-cn-hangzhou.aliyuncs.com", accessKeyID and accessKeySecret from Aliyun.
func NewOSSPresigner(endpoint, accessKeyID, accessKeySecret string) (*OSSPresigner, error) {
	client, err := oss.New(endpoint, accessKeyID, accessKeySecret)
	if err != nil {
		return nil, fmt.Errorf("oss client: %w", err)
	}
	return &OSSPresigner{client: client}, nil
}

func (p *OSSPresigner) PresignUpload(bucket, objectKey, contentType string, expiresIn time.Duration) (url string, method string, headers map[string]string, err error) {
	b, err := p.client.Bucket(bucket)
	if err != nil {
		return "", "", nil, err
	}
	expSec := int64(expiresIn.Seconds())
	if expSec <= 0 {
		expSec = 900
	}
	opts := []oss.Option{}
	if contentType != "" {
		opts = append(opts, oss.ContentType(contentType))
	}
	signed, err := b.SignURL(objectKey, oss.HTTPPut, expSec, opts...)
	if err != nil {
		return "", "", nil, err
	}
	h := map[string]string{}
	if contentType != "" {
		h["Content-Type"] = contentType
	}
	return signed, "PUT", h, nil
}

func (p *OSSPresigner) PresignDownload(bucket, objectKey string, expiresIn time.Duration) (url string, err error) {
	b, err := p.client.Bucket(bucket)
	if err != nil {
		return "", err
	}
	expSec := int64(expiresIn.Seconds())
	if expSec <= 0 {
		expSec = 60
	}
	return b.SignURL(objectKey, oss.HTTPGet, expSec)
}
