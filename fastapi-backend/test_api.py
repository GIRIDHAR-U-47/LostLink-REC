import requests

def test_get_found():
    url = "http://localhost:8080/api/items/found"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            items = response.json()
            print(f"Total items fetched: {len(items)}")
            for item in items:
                print(f"ID: {item.get('id')}, Type: {item.get('type')}, Category: {item.get('category')}, Description: {item.get('description')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_get_found()
