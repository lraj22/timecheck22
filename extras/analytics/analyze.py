import pandas as pd
from scipy import stats
import country_converter as coco
import os

# Declare logging/file-writing/printing handler
does_write_print = True
lines_to_write = []
def write (*args):
	if does_write_print: print(*args)
	args = map(str, args)
	lines_to_write.append(' '.join(args) + '\n')

# Find CSVs
script_dir = os.path.dirname(__file__)
csv_base = "tc22-umami-data-2026-jan-1/"
session_data_csv_path = os.path.join(script_dir, csv_base + "session_data.csv")
event_data_csv_path = os.path.join(script_dir, csv_base + "event_data.csv")
website_event_csv_path = os.path.join(script_dir, csv_base + "website_event.csv")
analytics_report_file_path = os.path.join(script_dir, 'latest_analytics_report.txt')

# Load session data
sd_df = pd.read_csv(session_data_csv_path, parse_dates=['created_at'])
sd_df = sd_df.drop(columns=['website_id', 'number_value', 'date_value', 'data_type', 'distinct_id', 'job_id'])

# Get developer/old sessions
cond_1 = ((sd_df['data_key'] == 'env') & (sd_df['string_value'] == 'dev')) # env=dev
cond_2 = (sd_df['data_key'] == 'profile') # profile=[identifier for one of my testing devices]
cond_3 = ((sd_df['data_key'] == 'schoolId') & (sd_df['string_value'] == '2') & (sd_df['created_at'] > '2025-12-20') & (sd_df['created_at'] < '2025-12-31')) # no production Cal Aero (schoolId: 2) users during 2025 Dec 20-31, only developers
dev_session_mask = (cond_1 | cond_2 | cond_3)
dev_sessions = sd_df[dev_session_mask]
dev_ids = dev_sessions['session_id'].unique()

# Get user sessions
user_sessions = sd_df[~sd_df['session_id'].isin(dev_ids)]
user_ids = user_sessions['session_id'].unique()

# Load website events data, drop extraneous/unnecessary columns
we_df = pd.read_csv(website_event_csv_path, parse_dates=['created_at'])
we_df = we_df.drop(columns=['website_id', 'url_query', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer_path', 'referrer_query', 'page_title', 'gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id', 'twclid', 'tag', 'distinct_id', 'job_id'])

# Get developer/old visits
bad_we_visits_mask = (
	(we_df['created_at'] < '2025-12-13 09:30:00') | # analytics events were added in commit e2eebadce74aefe153aef4a71d7b4bf931cc5861, although theoretically older visits COULD still be valid
	(we_df['session_id'].isin(dev_ids))
)
bad_we_visits = we_df[bad_we_visits_mask]
bad_we_visit_ids = bad_we_visits['visit_id'].unique()
bad_we_event_ids = bad_we_visits['event_id'].unique()

# Get real valid user events
user_we_events = we_df[~we_df['visit_id'].isin(bad_we_visit_ids)]

# Load event data
ed_df = pd.read_csv(event_data_csv_path, parse_dates=['created_at'])
ed_df = ed_df.drop(columns=['website_id', 'url_path', 'number_value', 'date_value', 'data_type', 'job_id']) # note to self: remove 'url_path' from drop list when other pages get events on them

# Filter out invalid data
# old notes-updated events fired too much before a bugfix was committed (de24e77862d4dcc3c2a3340fdb6dabb60e06cacc)
NOTES_UPDATED_OVERFIRE_FIXED_TS = '2025-12-31 12:15'
valid_notes_updated_event_ids = ed_df[(
	(ed_df['event_name'] == 'notes-updated') &
	(ed_df['data_key'] == 'length')
)][['session_id', 'event_id', 'string_value']].drop_duplicates(subset=['session_id', 'string_value'])['event_id'].unique()
valid_ed_events = ed_df[~(
	(ed_df['event_name'] == 'notes-updated') &
	(ed_df['created_at'] < NOTES_UPDATED_OVERFIRE_FIXED_TS) &
	(~ed_df['event_id'].isin(valid_notes_updated_event_ids))
)]
user_we_events = user_we_events[~(
	(user_we_events['event_name'] == 'notes-updated') &
	(user_we_events['created_at'] < NOTES_UPDATED_OVERFIRE_FIXED_TS) &
	(~user_we_events['event_id'].isin(valid_notes_updated_event_ids))
)]
# Remove bad events as defined above
valid_ed_events = valid_ed_events[~valid_ed_events['event_id'].isin(bad_we_event_ids)]



# Get country names from Umami source data (ISO 3166-1 alpha-2 country codes)
country_subset = user_we_events[['session_id', 'country']].drop_duplicates()
cc = coco.CountryConverter()
country_codes = country_subset['country'].unique()
countries = []
for country_code in country_codes:
	country_name = cc.convert(names=country_code, to="name")
	country_count = len(country_subset[country_subset['country'] == country_code])
	countries.append(f'{country_name} ({country_count})')

"""
Notes:
	- Session = (hopefully unique) person/visitor/user
	- Visit = a length of time where a user interacts with the website. Comes under session, aka a user can have many visits
	- View = when a page is viewed. Comes under visit, so in one visit, a page can be viewed multiple times
"""



# Show initial data
total_user_sessions = len(user_we_events['session_id'].unique())
visits_df = user_we_events[['session_id', 'visit_id']].drop_duplicates()
total_user_visits = len(visits_df)
total_user_views = len(user_we_events[user_we_events['event_type'] == 1])
write("###")
write("Processed", len(we_df), "records, removed", len(we_df) - len(user_we_events), "development/old/invalid events from that.")
write("The following statistics are based on the remaining", len(user_we_events), "real user events.")
write("From the first record at", user_we_events['created_at'].min(), "to the last record at", user_we_events['created_at'].max(), "in UTC")
write("###")
write("Number of unique real people:", total_user_sessions)
write("They come from", len(countries), "different countries:", ', '.join(countries))
write("Number of real user page visits:", total_user_visits)
write("Number of real user page views:", total_user_views)
write("---")
write()



# Count number of repeat visitors
number_of_users = -1
repeat_subset = visits_df.copy()
repeats = []

while len(repeat_subset) != 0:
	number_of_users = len(repeat_subset[~repeat_subset.duplicated('session_id', keep=False)])
	repeats.append(number_of_users)
	
	repeat_subset = repeat_subset[repeat_subset.duplicated('session_id')]

repeat_count = 1
write("== Repeat visitors ==")
for amount in repeats:
	write(amount, "person" if amount == 1 else "people", "visited exactly", repeat_count, "time" if repeat_count == 1 else "times")
	repeat_count += 1
write()



# Check what kinds of devices are used
write("== Devices used ==")
devices_by_session_id = user_we_events.groupby('session_id')['device'].unique()
for device, count in devices_by_session_id.explode().value_counts().items():
	write(count, "user is" if count == 1 else "users are", "using a", device)
write("Note that one user can use multiple devices, so total may not add to", total_user_sessions, "(total # of users)")
write()

# This one showed which users used device combos. I'm not sure how that's possible so I just commented it :>
# write("-- Device usage combos --")
# for devices, count in devices_by_session_id.value_counts().items():
# 	write(count, "person uses" if count == 1 else "people use", "the following:", ' & '.join(devices))



# Check where they came from
write("== Visitor referrals ==")
referrer_map = {
	'siege.hackclub.com': 'Siege (via Hack Club)',
	'com.slack': 'Slack App',
	'l.instagram.com': 'Instagram',
	'm.facebook.com': 'Facebook',
	'google.com': 'Google',
	'github.com': 'GitHub',
}
number_of_users_by_referrer = user_we_events.groupby('visit_id')['referrer_domain'].unique().explode().value_counts(dropna=False).items()
for referrer, count in number_of_users_by_referrer:
	if pd.isna(referrer):
		write(count, "user" if count == 1 else "users", "visited TC22 directly (not referred)")
	else:
		write(count, "user" if count == 1 else "users", "reached TC22 via", referrer_map.get(referrer, referrer))
write("Note that one user can use visit multiple times, so total may not add to", total_user_sessions, "(total # of users)")
write()



# Events overview
event_names_by_session_id = valid_ed_events.groupby('session_id')['event_name'].count()
event_names_by_session_id = pd.concat([event_names_by_session_id, pd.Series([0] * (total_user_sessions - len(event_names_by_session_id)))]) # Fill with 0-event users until proper number of users achieved
avg_events_per_user = round(event_names_by_session_id.mean(), 2)
percentile_of_avg_events = round(stats.percentileofscore(event_names_by_session_id, event_names_by_session_id.mean()), 2)
quantile_values = event_names_by_session_id.quantile([0.25, 0.5, 0.75]).tolist()
write('== Events overview ==')
write(f'There are {total_user_sessions} users, and on average, each user does about {avg_events_per_user} events. This is more than {percentile_of_avg_events}% of users. 75% of users have at least {quantile_values[0]} events, 50% of users have at least {quantile_values[1]} events, and 25% of users have at least {quantile_values[2]} events. The user with the most events has {event_names_by_session_id.max()} events.')



# Write to analytics report file
with open(analytics_report_file_path, 'w') as report_file:
	report_file.writelines(lines_to_write)



# Check uniqueness (dev)
exit(0) # only for developers!
col_a = 'visit_id'
col_b = 'session_id'
df = we_df[['session_id', 'visit_id']]
unique_counts = df.groupby(col_a)[col_b].nunique()
those_with_multiple = unique_counts[unique_counts > 1]

list_of_multiple = those_with_multiple.index.tolist()
print(f"[{col_a}]s with multiple [{col_b}]s: {list_of_multiple} ({col_a})")
for item in list_of_multiple:
	print(f'{col_a} == {item}:\n', df[df[col_a] == item])
	print(f'Associated {col_b} values:', df[df[col_a] == item][col_b].unique())
