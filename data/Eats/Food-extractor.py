import requests
import csv

def fetch_and_convert_to_csv():
    # API URL
    api_url = "https://usu.edu.au/page-data/sq/d/2251439712.json"

    try:
        # Fetch data from the API
        response = requests.get(api_url)
        response.raise_for_status()
        json_data = response.json()

        # Extract relevant nodes
        locations = json_data["data"]["allWpEatsLocation"]["nodes"]

        # Prepare CSV data
        csv_data = []
        for location in locations:
            location_name = location["name"]
            for eat in location["eats"]["nodes"]:
                title = eat["title"]
                uri = eat["uri"].replace("/eats", "")
                url = f"https://usu.edu.au/food-drink{uri}"
                opening_hours = eat["usueatsFields"].get("openingHours")

                # Flatten opening hours, handling None gracefully
                if opening_hours:
                    hours = "; ".join(f"{hour['days']}: {hour['hours']}" for hour in opening_hours)
                else:
                    hours = "No opening hours available"

                csv_data.append({
                    "Name": location_name,
                    "Title": title,
                    "URL": url,
                    "Opening Hours": hours,
                })

        # Write to CSV
        with open("eats_locations.csv", "w", newline="", encoding="utf-8") as csvfile:
            fieldnames = ["Name", "Title", "URL", "Opening Hours"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            # Write header and rows
            writer.writeheader()
            writer.writerows(csv_data)

        print("CSV file 'eats_locations.csv' created successfully.")

    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
    except KeyError as e:
        print(f"Error processing JSON data: Missing key {e}")

if __name__ == "__main__":
    fetch_and_convert_to_csv()
