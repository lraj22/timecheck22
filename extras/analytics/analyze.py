import pandas as pd
import country_converter as coco
import os

# Find CSVs
script_dir = os.path.dirname(__file__)
csv_base = "tc22-umami-data-2025-dec-26/"
session_data_csv_path = os.path.join(script_dir, csv_base + "session_data.csv")
event_data_csv_path = os.path.join(script_dir, csv_base + "event_data.csv")
website_event_csv_path = os.path.join(script_dir, csv_base + "website_event.csv")

# Load session data
sd_df = pd.read_csv(session_data_csv_path, parse_dates=['created_at'])
sd_df = sd_df.drop(columns=['website_id', 'number_value', 'date_value', 'data_type', 'distinct_id', 'job_id'])

# Get developer/old sessions
cond_1 = sd_df['string_value'] == 'dev' # env=dev
cond_2 = sd_df['data_key'] == 'profile' # profile=[identifier for one of my testing devices]
dev_session_mask = (cond_1 | cond_2)
dev_sessions = sd_df[dev_session_mask]
dev_ids = dev_sessions['session_id'].unique()

# Get user sessions
user_sessions = sd_df[~sd_df['session_id'].isin(dev_ids)]
user_ids = user_sessions['session_id'].unique()

# Load website events data
we_df = pd.read_csv(website_event_csv_path, parse_dates=['created_at'])
we_df = we_df.drop(columns=['website_id', 'url_query', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer_path', 'referrer_query', 'page_title', 'gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id', 'twclid', 'tag', 'distinct_id', 'job_id'])

# Get developer/old sessions
dev_we_events_mask = (we_df['created_at'] < '2025-12-13 09:30:00') | (we_df['session_id'].isin(dev_ids))
dev_we_events = we_df[dev_we_events_mask]
dev_we_visit_ids = dev_we_events['visit_id'].unique()

# Get user sessions
user_we_events = we_df[~we_df['visit_id'].isin(dev_we_visit_ids)]

# Get country names from Umami source data (ISO 3166-1 alpha-2 country codes)
cc = coco.CountryConverter()
countries = cc.convert(names=we_df['country'].unique(), to="name")

"""
Notes:
	- Session = (hopefully unique) person/visitor/user
	- Visit = a length of time where a user interacts with the website. Comes under session, aka a user can have many visits
	- View = when a page is viewed. Comes under visit, so in one visit, a page can be viewed multiple times
"""

# Show initial data
print("###")
print("Processed", len(we_df), "records, removed", len(dev_we_events), "development/old events from that.")
print("The following statistics are based on the remaining", len(user_we_events), "real user events.")
print("From the first record at", user_we_events['created_at'].min(), "to the last record at", user_we_events['created_at'].max(), "in UTC")
print("###")
print("Number of unique real people:", len(user_we_events['session_id'].unique()))
print("They come from", len(countries), "different countries:", ', '.join(countries))
print("Number of real user page visits:", len(user_we_events['visit_id'].unique()))
print("Number of real user page views:", len(user_we_events[user_we_events['event_type'] == 1]))
print("---")

# Count number of repeat visitors
visits_df = user_we_events[['session_id', 'visit_id']].drop_duplicates('visit_id')
number_of_users = -1
repeat_subset = visits_df.copy()
repeats = []

while len(repeat_subset) != 0:
	number_of_users = len(repeat_subset[~repeat_subset.duplicated('session_id', keep=False)])
	repeats.append(number_of_users)
	
	repeat_subset = repeat_subset[repeat_subset.duplicated('session_id')]

repeat_count = 1
for amount in repeats:
	print(amount, "person" if amount == 1 else "people", "visited exactly", repeat_count, "time" if repeat_count == 1 else "times")
	repeat_count += 1
