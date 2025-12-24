# Context

## Introduction

This documentation file will explain (in detail, hopefully) how to write and maintain a context file! This is for version 2 context.

It will get updated over time, so if something is missing, just open an issue and I'll look into it.

## NOTICE: v1 to v2

Are you looking to convert your `"version": 1` context to `"version": 2` context? Use the v1 to v2 conversion tool: <https://timecheck22.lraj22.xyz/migrate-v1-to-v2.html>. If the link doesn't work, you should be able to find the files to run locally in this repository.

It can do all the work automatically!

## NOTICE: v2 to v3?

v3 context might be coming soon! This guide will be updated accordingly when the time comes.

## Basic fields

The context file is a JSON file called `context.json`. Wow, I couldn't have guessed! It comprises of some basic fields in the format below:

```json
{
	"version": 2,
	"last_updated_id": "YYYY-MM-DD-XX",
	"metadata": {
		"school_id": 0,
		"school_name": "Example High School",
		"short_name": "EHS",
		"timezone": "America/Los_Angeles"
	},
	
	"divisions": [],
	
	"announcements": [],
	
	"scheduling_rules": [],
	
	"schedules": [],
	
	"full_day_overrides": [],
	
	"timeframe_overrides": []
}

```

These are the most basic fields:
- `version`: Version of the context file. Should be `2`, since that's the latest. ~~I doubt this will change, but it's there.~~ Correction: I changed it from 1 to 2! If you still have a version 1 context, use the automatic context upgrade tool.
- `last_updated_id`: A generic marker for when the file was last updated. Includes full year, month, then day, and then a two digit number representing the update number (`01` for first update that day, up to `99`). If for some reason you've updated more than 99 times, you can just switch to a larger ID, like `0100` to `9999`. This is just for recordkeeping and isn't actually used anywhere (yet?).
- `metadata` contains basic properties related to the school itself.
	- `school_id`: A unique ID given to each school to manage caching of responses. Nothing will explode if two schools use the same ID (see IAQ #1), but it should be different for each school in each context file.
	- `school_name`: Name of the school, as commonly known by students there. For example: If your school is called "Ruben S. Ayala High School" but everyone calls it "Ayala High School", it would make sense to just put "Ayala High School" as the name, even though that's not the actual name.
	- `short_name`: A very short form (like initials or so) of the school. For example, Chino Hills High School would be CHHS. This does not need to be unique.
	- `timezone`: the timezone of the school. The clock is always in the timezone of the selected school. If no school is selected, the clock uses the user's local timezone.

## Divisions

This won't be used by all schools. However, some schools have different schedules for different groups of students, usually separated by grade level. For this reason, I called this "divisions" -- let me know if you have a better idea! For example, Ruth Fox Middle School has lunch break at different times for 7th and 8th graders. So, selecting just your school (RFMS) is not sufficient; one must also select a division.

For schools to which this does not apply, leave this as an empty array (`[]`). The UI will not show anything about divisions. Divisions that exist are treated as additions/overrides to the global defaults. For example, any schedules defined here will only be available to reference in its respective division, any scheduling rules will only apply to users in this division, etc. Divisions can add to/override anything except for `metadata.school_id` and `metadata.timezone`. However, every field is optional. Here's an example of a completely filled out division for 9th graders of an exemplar high school.

```json
{
	// ...
	
	"divisions": [
		{
			"details": {
				"division_name": "9th graders",
				"division_id": "9"
			},
			"metadata": {
				"school_name": "Test HS for 9th graders",
				"short_name": "THS/9"
			},
			"announcements": [
				{
					"message": "Only 9th graders can see this!",
					"applies": ["8 am -- 4 pm"]
				}
			],
			"scheduling_rules": [
				// include exclusively relevant scheduling rules here...
			],
			"schedules": [
				// include exclusively relevant schedules here...
			],
			"full_day_overrides": [
				// include exclusively relevant FDOs here...
			],
			"timeframe_overrides": [
				// include exclusively relevant TFOs here...
			]
		}
		
		// ... there would likely be similar divisions for 10th, 11th, and 12th ...
	],
	
	// ...
}
```

If a division has no particular scheduling rules to add, it can just completely exclude that field instead of leaving it as an empty array/object. Up to you!

## Announcements

Announcements appear at the top of the clock for the time period defined. They can't be cleared by user (yet?). More than one announcement can be active at a time, but that's usually annoying. Here's what announcements look like:

```json
{
	// ...
	
	"announcements": [
		{
			"message": "Happy Halloween! 🎃",
			"applies": ["2025-10-31"]
		},
		{
			"message": "Enjoy your 4-day weekend!",
			"applies": ["2025-11-08 -- 2025-11-11 | end"]
		}
	],
	
	// ...
}
```

Each announcement only shows when its time comes, so you can define them ahead of time.

`message`: The announcement. It's in HTML, so you can add whatever formatting you like. **WARNING**: Only school managers can edit announcements (with implied HTML powers), and they should be careful not to add dangerous elements like `<script>` and `<img>`.

`applies`: You'll see this a lot. The `applies` key is usually an array (list) that contains times when the thing (in this case, the announcement) is active. You can specify multiple active ranges by putting multiple strings in the array. If you find it difficult to understand what you're looking at here, you can check out the section on reading context times.

## Scheduling rules

```json
{
	// ...
	
	"scheduling_rules": [
		{
			"matcher": "dayOfTheWeek",
			"pattern": "1",
			"schedule": "lateStart"
		},
		{
			"matcher": "dayOfTheWeek",
			"pattern": "2 -- 5",
			"schedule": "regular"
		}
	],
	
	// ...
}
```

Scheduling rules describe how school days are automatically scheduled. For example, your school may have regular days on Monday, Tuesday, Wednesday, and Friday, while Thursday is a minimum day. Saturday and Sunday would be days without school. The idea is, this is true of every week of the year and doesn't need to be repeated over and over and over -- write it once, write it now, and write it here.

The example you see above says that on Monday, the school uses "Late Start" schedule (school starts late and ends at the same time). On Tuesday to Friday, it's on regular schedule. On Saturday and Sunday (unspecified), it does nothing (`none` schedule).

By default, there is an implied scheduling rule at the end like this:

```json
{
	"matcher": "dayOfTheWeek",
	"pattern": "1 -- 7",
	"schedule": "none"
}
```

So, if there are no scheduling rules given, it will be scheduled `none` by default. Below is what each field of each rule does.

`matcher`: The type of pattern to match.
- Available values: `dayOfTheWeek` (yeah, only one right now. I'll add more if needed)

`pattern`: What to actually match.
- EXAMPLE: `matcher` says we're matching days of the week, and `pattern` says we're only matching `4` (Thursday).
- Available values: depends on the matching pattern.
	- For `dayOfTheWeek`, it can be a single number to represent a single day of the week, or a range (`X -- Y`) to represent a range. 1 is Monday, 5 is Friday, 6 is Saturday, and 7 is Sunday.

`schedule`: The actual schedule to use on the matched days.
- Available values: any schedule ID that has been defined in `schedules`, or `none` (blank schedule).

Side note: You can have as many rules as you want. By the way, if many rules match, the first rule to do so will be the selected schedule.

## Schedules

This will likely have the most data, since schedules are very detailed and most schools have many of them. Here's a small example of what it could look like:

```json
{
	// ...
	
	"schedules": [
		{
			"id": "noSchool",
			"label": "No school",
			"timings": [
				{
					"label": "No school",
					"applies": "8:00 AM -- 9:22 PM"
				}
			]
		},
		{
			"id": "regular",
			"label": "Regular",
			"timings": [
				{
					"label": "Waiting for first bell",
					"applies": "8:00 AM -- 8:30 AM"
				},
				{
					"label": "Get to 1st period",
					"applies": "8:30 AM -- 8:35 AM"
				},
				{
					"label": "1st period",
					"applies": "8:35 AM -- 9:32 AM"
				},
				{
					"label": "1st-2nd passing period",
					"applies": "9:32 AM -- 9:38 AM"
				},
				{
					"label": "2nd period",
					"applies": "9:38 AM -- 10:40 AM"
				},
				{
					"label": "2nd-3rd passing period",
					"applies": "10:40 AM -- 10:46 AM"
				},
				{
					"label": "3rd period",
					"applies": "10:46 AM -- 11:43 AM"
				},
				{
					"label": "3rd-4th passing period",
					"applies": "11:43 AM -- 11:49 AM"
				},
				{
					"label": "4th period",
					"applies": "11:49 AM -- 12:46 PM"
				},
				{
					"label": "Lunch",
					"applies": "12:46 PM -- 1:16 PM"
				},
				{
					"label": "Lunch-5th passing period",
					"applies": "1:16 PM -- 1:22 PM"
				},
				{
					"label": "5th period",
					"applies": "1:22 PM -- 2:19 PM"
				},
				{
					"label": "5th-6th passing period",
					"applies": "2:19 PM -- 2:25 PM"
				},
				{
					"label": "6th period",
					"applies": "2:25 PM -- 3:22 PM"
				},
				{
					"label": "School's over!",
					"applies": "3:22 PM -- 9:00 PM"
				}
			]
		},
		// ... more schedules here ...
	],
	
	// ...
}
```

- `id`: How your schedule will be referred to internally. Example: `minimum`.

- `label`: How your schedule will appear to the user. This is different from the label so you can add more information and format this nicely. Example: `Minimum` or `Minimum Day` or `Minimum Schedule`.

- `timings`: An array that assigns time ranges to various labels. In simpler terms, it maps each period to when it happens. Each time period is represented by an object with a `label` and an `applies`. Careful, this `applies` is NOT an array. If you want to give multiple times for a single period, create multiple period objects. One example of that is if all your passing periods are called "Passing period" - you'd have to create separate objects for each passing period, you can't just write an array `applies`. Here an example; one that I wrote for my school (copied from above example):

<details>
<summary>Expand example</summary>

```json
"timings": [
	{
		"label": "Waiting for first bell",
		"applies": "8:00 AM -- 8:30 AM"
	},
	{
		"label": "Get to 1st period",
		"applies": "8:30 AM -- 8:35 AM"
	},
	{
		"label": "1st period",
		"applies": "8:35 AM -- 9:32 AM"
	},
	{
		"label": "1st-2nd passing period",
		"applies": "9:32 AM -- 9:38 AM"
	},
	{
		"label": "2nd period",
		"applies": "9:38 AM -- 10:40 AM"
	},
	{
		"label": "2nd-3rd passing period",
		"applies": "10:40 AM -- 10:46 AM"
	},
	{
		"label": "3rd period",
		"applies": "10:46 AM -- 11:43 AM"
	},
	{
		"label": "3rd-4th passing period",
		"applies": "11:43 AM -- 11:49 AM"
	},
	{
		"label": "4th period",
		"applies": "11:49 AM -- 12:46 PM"
	},
	{
		"label": "Lunch",
		"applies": "12:46 PM -- 1:16 PM"
	},
	{
		"label": "Lunch-5th passing period",
		"applies": "1:16 PM -- 1:22 PM"
	},
	{
		"label": "5th period",
		"applies": "1:22 PM -- 2:19 PM"
	},
	{
		"label": "5th-6th passing period",
		"applies": "2:19 PM -- 2:25 PM"
	},
	{
		"label": "6th period",
		"applies": "2:25 PM -- 3:22 PM"
	},
	{
		"label": "School's over!",
		"applies": "3:22 PM -- 9:00 PM"
	}
]
```
</details>

It may take some time getting used to writing these, but it's not tooooo difficult. I hope. Even if it looks hard, it's mostly automated with the Context Editor.

---

Let's talk more about schedules. I like to add every possible schedule from the entire school year here, but that is up to you. For example, I have schedules for "No School", "Late Start", "Regular", "Rally", "Minimum", "Block 1", "Block 2", "Finals Block 1", and "Finals Block 2", even though some of these only happen on one or two days.

What if I chose not to have them predefined in `schedules`? Then, on those one or two days, I would need to add an override with the full unique schedule written out, which I don't want to do. You'll see more about overrides later, but for now understand this: these are the schedules, and every schedule that will ever happen will eventually be in your context file. You can choose whether to have them all defined all the time (my preference), or only add them to the file when they're necessary (in overrides), but they will be there eventually. It's just a matter of choice as to when. You'll get used to it eventually!

## Full day overrides

As you know, not every single week of school is the exact same. Sometimes there are one-day holidays (ex. Martin Luther King Jr. Day), one week breaks (ex. Spring Break), or even longer breaks (ex. Winter Break). What do we do about these?

Well, um, I might have revealed it earlier in the title, but *full day overrides*. These tell TC22 to ignore the usual scheduling rules for that day and instead use a different schedule instead. Have a look:

```json
{
	// ...
	
	"full_day_overrides": [
		{
			"occasion": "Veterans' Day (long weekend)",
			"applies": ["2025-11-10 -- 2025-11-11 | end"],
			"schedule": "noSchool"
		},
		{
			"occasion": "Thanksgiving Break",
			"applies": ["2025-11-24 -- 2025-11-28 | end"],
			"schedule": "noSchool"
		},
		{
			"occasion": "Winter Break",
			"applies": [
				"2025-12-18 -- 2025-12-19 | end",
				"2025-12-22 -- 2025-12-26 | end",
				"2025-12-29 -- 2026-01-02 | end"
			],
			"schedule": "noSchool"
		},
		{
			"occasion": "Martin Luther King Jr. Day (no school)",
			"applies": ["2026-01-19"],
			"schedule": "noSchool"
		},
		{
			"occasion": "Abraham Lincoln's Birthday (no school)",
			"applies": ["2026-02-09"],
			"schedule": "noSchool"
		},
		{
			"occasion": "George Washington's Birthday (no school)",
			"applies": ["2026-02-16"],
			"schedule": "noSchool"
		},
		{
			"occasion": "Spring Break",
			"applies": ["2026-03-30 -- 2026-04-03 | end"],
			"schedule": "noSchool"
		},
		{
			"occasion": "Easter Monday (no school)",
			"applies": ["2026-04-06"],
			"schedule": "noSchool"
		},
		{
			"occasion": "Summer Break",
			"applies": ["2026-05-22 -- 2026-08-07 | end"],
			"schedule": "none"
		}
	],
}
```

As you can see, these ALSO have to be very thorough. You don't want to have the clock telling people about 4th period when it's Summer Break!

`occasion`: What is shown to the user when they check the override in the Schedules panel in the sidebar. This should be the reason (occasion) why the day is different - is it a holiday? Assembly schedule day? Tell us!

`applies`: The time ranges when it is applied. You can include as many time ranges as you want. Ranges will oftentimes will use ` | end` flag to indicate end of that time block. For example, `XXXX-XX-XX -- 2025-11-28 | end` means that it goes to the end of November 28 (next day 12am / 00:00). Without the end flag, it means to the **start** of November 28 (12am / 00:00), which is not what I intended.

In effect it's the same as writing `XXXX-XX-XX -- 2025-11-29` (start of 29 === end of 28), but to some people, writing the day after it ends doesn't make sense. I don't know, lol. Do whatever makes sense to you. Just make sure that it accurately describes the stretch of time. This can get confusing, so if it's hard to understand, be sure to read the section on reading time parts.

`schedule`: The schedule to use when the day comes. You use the schedule ID, or `none` for a blank schedule. OR, if you don't have all your schedules defined like I do, you can actually write in a complete schedule here! For example:

```json
{
	// ...
	
	"full_day_overrides": [
		{
			"occasion": "Block Schedule (Finals)",
			"applies": [
				"2026-05-20 -- 2026-05-21 | end"
			],
			"schedule": {
				"id": "finalsBlock",
				"label": "Finals Block Schedule",
				"timings": [
					{
						"label": "Waiting for first bell",
						"applies": "8:00 AM -- 8:30 AM"
					},
					{
						"label": "Get to 1st period",
						"applies": "8:30 AM -- 8:35 AM"
					},
					{
						"label": "1st period",
						"applies": "8:35 AM -- 10:04 AM"
					},
					{
						"label": "1st-3rd passing period",
						"applies": "10:04 AM -- 10:10 AM"
					},
					{
						"label": "3rd period",
						"applies": "10:10 AM -- 11:39 AM"
					},
					{
						"label": "Lunch",
						"applies": "11:39 AM -- 12:09 PM"
					},
					{
						"label": "Lunch-5th passing period",
						"applies": "12:09 PM -- 12:15 PM"
					},
					{
						"label": "5th period",
						"applies": "12:15 PM -- 1:44 PM"
					},
					{
						"label": "School's over!",
						"applies": "1:44 PM -- 2:00 PM"
					}
				]
			}
		},
		
		// ... more full day overrides here ...
	],
	
	// ...
}
```

You don't actually need to specify an `id`, since this is a one-time use schedule. Also, you can leave out the `label` if you're fine with it automatically using the `occasion` key of the override as the label. But be sure to have the `timings`, since that will dictate the schedule that overrides the entire day. In my opinion, it's easier to just define this schedule in the `schedules` key and just specify the ID when needed, but it's up to you on what you think makes the most sense.

In my experience, it is easier to write all the full day overrides for the entire school year at the start and then add special ones (like assemblies, which aren't announced until later) later when they are announced. Most schools/districts have a year calendar you can find.

## Timeframe overrides

These are just like full day overrides, but they are for timeframes that aren't best described as days. For example, maybe one day has an afterschool event you want to add, but adding a completely new schedule that is identical to the regular day schedule with just one extra period doesn't make sense -- just add a timeframe override, so that the time that is usually blank after school is defined by a certain label!

```json
{
	// ...
	
	"timeframe_overrides": [
		{
			"occasion": "Back 2 School Night",
			"label": "Back to School Night: All periods",
			"applies": ["2025-08-20/05:30 PM -- 2025-08-20/07:00 PM"]
		}
	]
}
```

`occasion`: The occasion of the timeframe - like full day overrides, this is the reason for change. This appears in settings when the user looks at their schedules.

`label`: This is what appears in the spot where the period name usually appears, just like the `label` key from `timings`.

`applies`: An array of times when this timeframe applies. By nature of timeframes, it usually only has one item, but I made it flexible to include more if needed.

## Other topics

### Writing times and timeframes

You've been seeing many ways to write time throughout. Sometimes it's just one time part, and sometimes it's a range (`X -- Y`). This part will explain in detail what's going on.

I use Luxon for dates and times, so it is the one and only library that is handling these dates and times throughout. Luxon can represent Datetimes and Intervals, which are basically two Datetimes that represent a start and a stop. Almost everything in this file will be an Interval somehow, but I provide some leniency on how to write it. Let's have a quick overview.

You can write a single day: `2025-12-31` (YYYY-MM-DD) and it will automatically understand that you want to go from start of day to end of day. Similarly, you can write a single hour: `2025-12-31/8 AM` and it will understand that you want the start of the hour to the end of the hour. Be careful! If you write `2025-12-31/8:00 AM`, it will go from the start of the **minute** to the end of the **minute** (i.e., to 8:01 AM). Writing `2025-12-31/8:00:00 AM` will go from the start of the **second** to the end of the **second**, which is likely not what you wanted.

Along those lines, writing `2025` will go from the start of 2025 to the end of 2025. It's the same as `2025 -- 2026` (end of 2025 === start of 2026). If you want to go to the end of 2026 instead, you can write `2025 -- 2027` (end of 2026 === start of 2027) OR `2025 -- 2026 | end` OR `2025 -- 2026 | e` ('e' flag === 'end' flag), whatever makes the most sense to you.

You can also write a timeframe: `2025-12-31/22:00 -- 2026-01-01` and it will understand you want to go from the start of 22:00 (10 PM) on December 31 to the start of January 1 in 2026. Now, if you write `2025-12-31/22:00 -- 2026-01-01 | end`, it'll be start of 22:00 to the end of January 1. If you instead write `2025-12-31/22:00 -- 2026-01-01/12 AM | end`, it will only go to the end of the hour, so to 1:00 AM on January 1, instead of the end of the day. Beware: writing `12:00 AM` will take you to the end of the minute instead of the hour.

You can get very very specific with time. Here's a maxed out, complete time: `2025-06-07/08:09:10.112 AM`. You can write it in 24-hours time or AM/PM, it will understand both. Usually though, you won't need to go to milliseconds or even into seconds, that's usually too specific for practical usages. However, it IS possible, so don't hesitate to use it when necessary.

These Luxon times work everywhere, so you can do some unexpected things too. For example, you can set a full day override for less than a day by defining the hour/minute. It would be really weird if you did, but I guess it's possible. The only exception to this rule is the `pattern` field in the scheduling rules. It "looks" like a Luxon time with its range format, but it's not Luxon. It's just my own parsing, so it does not follow any of the rules I have outlined here (it has its own rules as defined in the scheduling rules section).

I know this is a *little* confusing, but once you get used to it, you'll be able to read any time part/timeframe and understand exactly what it means. If you have any suggestions on how to make it make more sense, I'd be glad to incorporate your ideas!

## IAQ
(aka, Infrequently Asked Questions)

Q1: What if two schools use the same ID?<br>
A1: I always make sure each school has a unique ID. Wait, do you mean like, a school manager edits their own context to steal a different school's ID? That shouldn't cause any problems, since all users make use of the IDs defined in `util.js` (aka: the file that I control). The ID stored in a school's context doesn't affect the user at all. It's just there for descriptory purposes - metadata!

Q2: This is a lot of data. How will the school managers keep up?<br>
A2: It's their job to keep it up to date. Honestly, most of this is a "set it up once and forget it" type of job. Personally, I only have to enter in a school rally or assembly day once in a while and push the new context the night before. It only takes a few minutes and helps out the students at my school. If school managers are unable to keep up, they can get people to help, but it's important that SOMEONE is updating it. Otherwise, it won't be accurate to the actual school schedule, which would invalidate the purpose of the context and TC22 in general.

Q3: Has context always been like this?<br>
A3: Surprisingly, no! A bit of history, but it used to only contain override data; no schedules, no metadata, no timezone or version, nothing else. Even the keys had different names that what you see right now. You can read a lot more about the history of `context.json` and of TimeCheck 22 in general in [the documented history](./History.md).
