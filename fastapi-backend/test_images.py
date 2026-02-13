import requests

# Test image serving
image_url = 'http://localhost:8080/static/images/3d26c16c-8804-4f57-8e0d-730c57a3a83e.jpeg'
r = requests.get(image_url, timeout=5)
print(f'Status: {r.status_code}')
print(f'Content-Type: {r.headers.get("content-type")}')
print(f'Size: {len(r.content)} bytes')

# Test with correct IP
image_url_correct = 'http://10.234.72.182:8080/static/images/3d26c16c-8804-4f57-8e0d-730c57a3a83e.jpeg'
r2 = requests.get(image_url_correct, timeout=5)
print(f'\nWith correct IP:')
print(f'Status: {r2.status_code}')
print(f'Size: {len(r2.content)} bytes')
