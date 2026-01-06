import pandas as pd
from scipy import stats
import country_converter as coco
import os
from datetime import datetime, UTC

# Declare logging/file-writing/printing handler
does_write_print = True
lines_to_write = []
def write (*args):
	if does_write_print: print(*args)
	args = map(str, args)
	lines_to_write.append(' '.join(args) + '\n')

# Find CSVs
script_dir = os.path.dirname(__file__)
csv_base = 'tc22-umami-data-2026-jan-5/'
session_data_csv_path = os.path.join(script_dir, csv_base + 'session_data.csv')
event_data_csv_path = os.path.join(script_dir, csv_base + 'event_data.csv')
website_event_csv_path = os.path.join(script_dir, csv_base + 'website_event.csv')
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
# analytics events were added in commit e2eebadce74aefe153aef4a71d7b4bf931cc5861, although theoretically older visits COULD still be valid
ANALYTICS_ADDED_TS = '2025-12-13 09:30:00'
bad_we_visits_mask = (
	(we_df['created_at'] < ANALYTICS_ADDED_TS) |
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
	country_name = cc.convert(names=country_code, to='name')
	country_count = len(country_subset[country_subset['country'] == country_code])
	countries.append(f'{country_name} ({country_count})')

'''
Notes:
	- Session = (hopefully unique) person/visitor/user
	- Visit = a length of time where a user interacts with the website. Comes under session, aka a user can have many visits
	- View = when a page is viewed. Comes under visit, so in one visit, a page can be viewed multiple times
'''



# Show initial data
total_user_sessions = len(user_we_events['session_id'].unique())
visits_df = user_we_events[['session_id', 'visit_id']].drop_duplicates()
total_user_visits = len(visits_df)
total_user_views = len(user_we_events[user_we_events['event_type'] == 1])
earlist_record = min(ed_df['created_at'].min(), sd_df['created_at'].min(), we_df['created_at'].min())
latest_record = min(ed_df['created_at'].max(), sd_df['created_at'].max(), we_df['created_at'].max())
total_records = len(ed_df) + len(sd_df) + len(we_df)
total_valid_records = len(valid_ed_events) + len(user_sessions) + len(user_we_events)
write('###')
write(f'Report generated at {datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')}. This report is based on data collected by and exported from Umami analytics. The earliest record in this export is from {earlist_record} while the latest record is from {latest_record}. Detailed Umami analytics (i.e. including events and not just page views) was added for the public on {ANALYTICS_ADDED_TS}, so records from before then are dropped, even though they may have been valid user visits.')
write('You can find the current public Umami analytics dashboard at <https://cloud.umami.is/share/b0K7JX1ecA9aZJPP>.')
write('---')
write(f'Processed {total_records} records, removed {total_records - total_valid_records} development/old/invalid events from that.')
write(f'The following statistics are based on the remaining {total_valid_records} real user events.')
write(f'From the first record at {user_we_events['created_at'].min()} to the last record at {user_we_events['created_at'].max()} in UTC.')
write('###')
write()
write('== Users, visits, and views ==')
write('Number of unique real people:', total_user_sessions)
write(f'They come from {len(countries)} different countries: {', '.join(countries)}')
write('Number of real user page visits:', total_user_visits)
write('Number of real user page views:', total_user_views)
write()



# Count number of repeat visitors
number_of_users = -1
repeat_subset = visits_df.copy()
repeats = []
def times (quantity, words='time', pluralizer=None):
	if isinstance(words, str):
		single = words
		if pluralizer == None: pluralizer = 's'
		plural = words + pluralizer
	else:
		single = words[0]
		if pluralizer == None: pluralizer = ''
		plural = words[1] + pluralizer
	return str(quantity) + ' ' + (single if quantity == 1 else plural)

while len(repeat_subset) != 0:
	repeat_users_subset = repeat_subset[~repeat_subset.duplicated('session_id', keep=False)]
	repeat_users_session_ids = repeat_users_subset['session_id']
	repeat_users_events = user_we_events[user_we_events['session_id'].isin(repeat_users_session_ids)]['event_id'].unique()
	repeats.append([len(repeat_users_subset), len(repeat_users_events)])
	
	repeat_subset = repeat_subset[repeat_subset.duplicated('session_id')]

repeat_count = 1
write('== Repeat visitors ==')
for user_count, event_count in repeats:
	write(f'{times(user_count, words=['person', 'people'])} visited exactly {times(repeat_count)}. They accounted for {times(event_count, words='event')}.')
	repeat_count += 1
write('Note that events here includes page views and so will be higher than the events in the events overview/in detail below.')
write()



# Check what kinds of devices are used
write('== Devices used ==')
devices_by_session_id = user_we_events.groupby('session_id')['device'].unique()
for device, count in devices_by_session_id.explode().value_counts().items():
	write(f'{times(count, words=['user is', 'users are'])} using a {device}.')
write(f'Note that one user can use multiple devices, so total may not add to {total_user_sessions} (total # of users).')
write()



# Check where they came from
write('== Visitor referrals ==')
referrer_map = {
	'siege.hackclub.com': 'Siege (via Hack Club)',
	'com.slack': 'Slack App',
	'l.instagram.com': 'Instagram (Mobile)',
	'm.facebook.com': 'Facebook (Mobile)',
	'google.com': 'Google',
	'github.com': 'GitHub',
	'facebook.com': 'Facebook',
	'instagram.com': 'Instagram',
}
number_of_users_by_referrer = user_we_events.groupby('visit_id')['referrer_domain'].unique().explode().value_counts(dropna=False).items()
for referrer, count in number_of_users_by_referrer:
	if pd.isna(referrer):
		write(times(count, words='user'), 'visited TC22 directly (not referred)')
	else:
		write(times(count, words='user'), 'reached TC22 via', referrer_map.get(referrer, referrer))
write('Note that one user can use visit multiple times, so total may not add to', total_user_sessions, '(total # of users).')
write()



# Events overview
event_names_by_session_id = valid_ed_events.drop_duplicates('event_id').groupby('session_id')['event_name'].count()
event_names_by_session_id = pd.concat([event_names_by_session_id, pd.Series([0] * (total_user_sessions - len(event_names_by_session_id)))]) # Fill with 0-event users until proper number of users achieved
avg_events_per_user = round(event_names_by_session_id.mean(), 2)
percentile_of_avg_events = round(stats.percentileofscore(event_names_by_session_id, event_names_by_session_id.mean()), 2)
quantile_values = event_names_by_session_id.quantile([0.25, 0.5, 0.75]).tolist()
write('== Events overview ==')
write(f'There are {total_user_sessions} users, and on average, each user does about {avg_events_per_user} events. This is more than {percentile_of_avg_events}% of users. 75% of users have at least {quantile_values[0]} events, 50% of users have at least {quantile_values[1]} events, and 25% of users have at least {quantile_values[2]} events. The user with the most events has {event_names_by_session_id.max()} events.')
event_count_ranges = ((0, 1), (2, 5), (6, 10), (11, 20), (21, 30), (31, 999))
for event_count_range in event_count_ranges:
	users_in_range_count = len(event_names_by_session_id[(
		(event_names_by_session_id >= event_count_range[0]) &
		(event_names_by_session_id <= event_count_range[1])
	)])
	single = (event_count_range[0] == event_count_range[1])
	write(f'{times(users_in_range_count, words='user')} have {event_count_range[0] if single else (f'between {event_count_range[0]} and {event_count_range[1]}')} {'event' if (single and (event_count_range[0] == 1)) else 'events'}.')
write()

# Events in detail
write('== Events in detail ==')
events_map = valid_ed_events.drop_duplicates('event_id')['event_name'].value_counts().items()
event_name_map = {
	'sidebar-page-navigated': 'Users went to a sidebar page',
	'sidebar-toggled': 'Users toggled the sidebar',
	'simulated-fullscreen-entered': 'Users entered the simulated fullscreen mode',
	'simulated-fullscreen-exited': 'Users exited the simulated fullscreen mode',
	'school-selected': 'Users picked their school',
	'school-name-clicked': 'Users clicked the school name in the bottom middle',
	'notes-toggled': 'Users toggled the notes widget',
	'setting-changed': 'Users changed their settings',
	'toggle-fullscreen-clicked': 'Users toggled fullscreen',
	'timer-toggled': 'Users toggled the timer widget',
	'get-pwa-clicked': 'Users clicked the "Get app" button',
	'stopwatch-toggled': 'Users toggled the stopwatch widget',
	'notes-updated': 'Users edited their notes',
	'timer-used': 'Users interacted with the timer widget',
	'stopwatch-used': 'Users interacted with the stopwatch widget',
}
schools_map = {
	-2: 'Always High School',
	-1: 'None',
	1: 'Chino Hills High School',
	2: 'Cal Aero Preserve Academy JH',
	3: 'Ayala High School',
	4: 'Ruth Fox Middle School',
}

def get_event_nkv_mask (name, key, values):
	if isinstance(values, str):
		values = {values}
	return (
		(valid_ed_events['event_name'] == name) &
		(valid_ed_events['data_key'] == key) &
		(valid_ed_events['string_value'].isin(values))
	)

def get_unique_events_by_nkv (name, key, values):
	return valid_ed_events[get_event_nkv_mask(name, key, values)].drop_duplicates('event_id')

def top_n_values (name, key, n):
	settings_changed = valid_ed_events[(
		(valid_ed_events['event_name'] == name) &
		(valid_ed_events['data_key'] == key)
	)]['string_value'].value_counts().items()
	total = 0
	result = []
	for setting, count in settings_changed:
		result.append([setting, count])
		total += 1
		if total >= n: break
	return [total, result]

def format_top_string_values (result):
	if len(result) > 1: result[-1][0] = 'and ' + result[-1][0]
	return (', ' if len(result) > 2 else ' ').join(map(lambda combined: f'{combined[0]} ({combined[1]})', result))

def get_auxiliary_event_info (event_name):
	info = ''
	
	if 0: pass # it looks nicer when the other ones are all 'elif' :]
	# By the way, I've commented events because the information isn't that useful to know. I'd rather a cleaner output with useful information that a messy one with all the information.
	elif event_name == 'setting-changed':
		total, setting_counts = top_n_values(event_name, 'setting', 5)
		info = f'The top {times(total, words='setting')} changed were {format_top_string_values(setting_counts)}.'
	elif event_name == 'school-selected':
		total, school_counts = top_n_values(event_name, 'schoolId', 3)
		school_counts = [[schools_map.get(int(schoolId), 'School ID ' + schoolId), count] for schoolId, count in school_counts]
		info = f'The top {times(total, words='school')} selected were {format_top_string_values(school_counts)}.'
	elif event_name == 'sidebar-page-navigated':
		total, page_counts = top_n_values(event_name, 'page', 5)
		info = f'The top {times(total, words='page')} navigated to were {format_top_string_values(page_counts)}.'
	elif event_name == 'school-name-clicked':
		no_school_count = len(get_unique_events_by_nkv(event_name, 'alreadySelected', 'false'))
		already_school_count = len(get_unique_events_by_nkv(event_name, 'alreadySelected', 'true'))
		info = f'This was {times(no_school_count, words=["user's", "users'"])} first school selected and {times(already_school_count, words='user')} already had a school selected.'
	elif event_name == 'simulated-fullscreen-entered':
		total, element_counts = top_n_values(event_name, 'id', 3)
		info = f'The top {times(total, words='element')} entered were {format_top_string_values(element_counts)}.'
	# elif event_name == 'simulated-fullscreen-exited':
	# 	total, element_counts = top_n_string_values(event_name, 'id', 3)
	# 	info = f'The top {times(total, words='element')} exited were {format_top_string_values(element_counts)}.'
	elif event_name == 'get-pwa-clicked':
		no_school_count = len(get_unique_events_by_nkv(event_name, 'outcome', 'dismissed'))
		already_school_count = len(get_unique_events_by_nkv(event_name, 'outcome', 'accepted'))
		info = f'The app download was accepted {times(already_school_count)} and dismissed {times(no_school_count)}.'
	elif event_name == 'notes-updated':
		longest_note_length = float(valid_ed_events[(
			(valid_ed_events['event_name'] == event_name) &
			(valid_ed_events['data_key'] == 'length')
		)]['string_value'].max())
		info = f'The longest note was {times(longest_note_length, words='character')}.'
	# elif event_name in {'stopwatch-toggled', 'timer-toggled', 'notes-toggled'}:
	# 	opened_count = len(get_unique_events_by_nkv(event_name, 'newState', 'open'))
	# 	closed_count = len(get_unique_events_by_nkv(event_name, 'newState', 'closed'))
	# 	info = f'It was opened {times(opened_count)} and closed {times(closed_count)}.'
	# elif event_name == 'sidebar-toggled':
	# 	opened_count = len(get_unique_events_by_nkv(event_name, 'isOpenNow', 'true'))
	# 	closed_count = len(get_unique_events_by_nkv(event_name, 'isOpenNow', 'false'))
	# 	info = f'It was toggled open {times(closed_count)} and closed {times(opened_count)}.'
	elif event_name == 'toggle-fullscreen-clicked':
		entered_count = len(get_unique_events_by_nkv(event_name, 'attemptedNewState', 'fullscreen'))
		exited_count = len(get_unique_events_by_nkv(event_name, 'attemptedNewState', 'no-fullscreen'))
		info = f'They entered fullscreen {times(entered_count)} and exited fullscreen {times(exited_count)}.'
	elif event_name == 'stopwatch-used':
		started_count = len(get_unique_events_by_nkv(event_name, 'event', 'start'))
		stopped_count = len(get_unique_events_by_nkv(event_name, 'event', 'stop'))
		resetted_count = len(get_unique_events_by_nkv(event_name, 'event', 'reset'))
		info = f'They started it {times(started_count)}, stopped it {times(stopped_count)}, and reset it {times(resetted_count)}.'
	elif event_name == 'timer-used':
		started_count = len(get_unique_events_by_nkv(event_name, 'event', 'start'))
		stopped_count = len(get_unique_events_by_nkv(event_name, 'event', 'stop'))
		muted_count = len(get_unique_events_by_nkv(event_name, 'event', 'mute'))
		unmuted_count = len(get_unique_events_by_nkv(event_name, 'event', 'unmute'))
		resetted_count = len(get_unique_events_by_nkv(event_name, 'event', 'reset'))
		info = f'They started it {times(started_count)}, stopped it {times(stopped_count)}, muted it {times(muted_count)}, unmuted it {times(unmuted_count)}, and reset it {times(resetted_count)}.'
	
	return info

for event_name, count in events_map:
	event_description = event_name_map.get(event_name)
	auxiliary_info = get_auxiliary_event_info(event_name)
	auxiliary_info = (' ' + auxiliary_info) if auxiliary_info else ''
	if event_description:
		write(f'{event_description} {times(count)}.{auxiliary_info}')
	else:
		write(f'The {event_name} event happened {times(count)}.{auxiliary_info}')
write()



# Write to analytics report file
write('End of report')
write('###')
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
print(f'[{col_a}]s with multiple [{col_b}]s: {list_of_multiple} ({col_a})')
for item in list_of_multiple:
	print(f'{col_a} == {item}:\n', df[df[col_a] == item])
	print(f'Associated {col_b} values:', df[df[col_a] == item][col_b].unique())
