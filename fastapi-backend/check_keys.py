import urllib.request
import json

def check_keys():
    url = "http://localhost:8080/api/items/found"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            if data:
                all_keys = sorted(data[0].keys())
                print(f"All keys in first item: {all_keys}")
                for key in all_keys:
                    print(f"  {key}: {type(data[0][key])}")
            else:
                print("No items found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_keys()
