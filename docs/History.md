# History of TimeCheck 22

Fair warning: This file is really for my own purposes and may not be formatted in the ways usually expected. However, it does contain some interesting historical information, so enjoy!

## context.json formats

<details open>
<summary>Version 2: Designed November 10, 2025. Standardized key names, reformed timings to array, and *actually* updated the version number :')</summary>

This update basically makes the data parseable by the Context Editor and attempts to perfect the format and keys in an attempt to not change it later, so that new School Managers don't have to worry about new formats.

```
context.json
	version: 2
	last_updated_id
	metadata
		school_id
		school_name
		short_name
		timezone
	announcements[]
		message
		applies[]
	scheduling_rules[]
		matcher
		pattern
		schedule
	schedules[]
		id
		label
		timings[]
			label
			applies
			hideStart?
			hideEnd?
	full_day_overrides
		occasion
		applies[]
		schedule
	timeframe_overrides
		occasion
		label
		applies[]
```
</details>

<details open>
<summary>Version 1 (standard): Designed September 14, 2025. Reformed schedules to array</summary>

```
context.json
	version: 1
	last_updated_id
	metadata
		schoolId
		name
		shortName
		timezone
	announcements[]
		message
		applies[]
	schedulingRules[]
		match
		pattern
		schedule
	schedules[]
		id
		label
		timings
			"label": applies[]
	full_day_overrides
		name
		applies[]
		schedule
	timeframe_overrides
		name
		applies[]
		description
```
</details>

<details>
<summary>Updated version 1 (not standard): Designed September 7, 2025. Added useful fields</summary>

```
context.json
	version: 1
	last_updated_id
	metadata
		schoolId
		name
		shortName
		timezone
	announcements[]
		message
		applies[]
	schedulingRules[]
		match
		pattern
		schedule
	schedules
		"name"
			timings
				"label": applies[]
	full_day_overrides
		name
		applies[]
		schedule
	timeframe_overrides
		name
		applies[]
		description
```
</details>

<details>
<summary>Initial version 1 (not standard): Designed September 6, 2025 for TimeCheck 22</summary>

```
context.json
	version: 1
	last_updated_id
	metadata
		name
		shortName
		timezone
	schedulingRules[]
		match
		pattern
		schedule
	schedules
		"name"
			timings
				"label": applies[]
	full_day_overrides
		name
		applies[]
		schedule
	timeframe_overrides
		name
		applies[]
		description
```
</details>

<details open>
<summary>Before it even had a version: Designed a looooong time ago, before TC22 was a thing. See the "historical timeline" below. Designed August 11, 2024.</summary>

```
context.json
	last_updated_id
	full_day_overrides[]
		name
		applies[]
		schedule
			"label": applies[]
	timeframe_overrides[]
		name
		applies[]
		description
```
</details>

<details>
<summary>Original format (not standard, it kinda just was there) - Designed August 11, 2024.</summary>

```
context.json
	last_updated_id
	overrides[]
		name
		applies[]
		fill_blank (boolean)
		updated_schedule
			"label": applies[]
```
</details>

## Progression of school clocks

### lraj22/chhsclock - CHHS Clock

It all started many years back with `chhsclock`, or CHHS Clock. Or maybe CHHSClock. I don't really know.

The first recorded commit for CHHS Clock is on November 3, 2023, but even that is followed by a commit called "Upload current files", so development must've started a little while before that. CHHS Clock was designed to be a minimal and easy tool that would just say what time it was, what period you were in, and how much time was left, but it had some big dreams too. Here's the original `TODO.md` from the second commit.

```markdown
# Roadmap for the CHHS Clock

Features to add soon:
- Other schedules
- Auto selection of schedules
- Time 'til next period
- Settings menu
- Flashing colon
- Motivational quotes
- Themes
```

\* Note: At that time, it only supported the one regular schedule that my school had on Tuesday - Friday. "Other schedules" literally meant the schedule that happens on every Monday (late start) and then after that, other rarer schedules! "Auto selection" was also considered a feature to add, because it wasn't even thought that it would be automatically choosing your schedules based on the day.

Safe to say, it was very basic, but the ideas were way ahead of its time. As of now (November 10, 2025), motivational quotes were never added, but themes WERE introduced. Definitely not anywhere near the time of CHHS Clock, though.

Since this was legitimately a project I did in my free time for the benefit of mostly myself, I worked so much in the first month and even started adding an admin dashboard to manage overrides. Ahead of its time, I'm telling ya. The admin dashboard was scrapped on August 10, 2024. I think that was because I wanted to keep it completely static so that it would work offline and against school filters too.

Overrides (now static, not admin dashboard) were added on August 11, 2024, and this is when I added the override repository to separate the commits to the context vs. the commits to the actual codebase. Oddly enough, the repo for the context was created Aug 10, but the context file itself was added Aug 11.

The first format looked like this:

```
context.json
	last_updated_id
	overrides[]
		name
		applies[]
		fill_blank (boolean)
		updated_schedule
			"label": applies[]
```

That's right! The oldest key in `context.json` is indeed `last_updated_id`! The `overrides` key was renamed to `full_day_overrides` when, in the next commit hoping to finalize the format, `timeframe_overrides` was also added.

```
context.json
	last_updated_id
	full_day_overrides[]
		name
		applies[]
		schedule
			"label": applies[]
	timeframe_overrides[]
		name
		applies[]
		description
```

Looking at it from the viewpoint of today, it seems weird to think that at one point in time, `context.json` only contained overrides. That was its only purpose. It provided CONTEXT to the year on when to do what. Nowadays, the meaning of 'context' expanded to cover everything, from the name & timezone of the school to its everyday happenings to the specific event that goes in the overrides.

Let's recap. Everything started around November 3, 2023 with the advent of CHHS Clock, and within one month, the most basic features were complete. 10 months later, after going through a lot of decision making and changes, overrides were added and improved upon until they were finalized. However, overrides were the only thing that `context.json` had, and this clock only works for CHHS. It was also not as customizable as preferable. After October 2024, it only received fixes and some data improvements, but no major features.

CHHS Clock still gets updates when important, but for now I've switched my focus. Let's see the next step on the road of the school clock.

### lraj22/ssc - School Schedule Clock

Hm, so CHHS Clock stopped getting big features after October 2024. Now it's December 2024 and the science fair is here and now. You know what's one big project I've been working for a year that has practical uses in real life? Wow, I can't believe you guessed it - CHHS Clock!

However, I can't submit something from the previous year, so I need to make it anew. Anyways, CHHS Clock needs a BIG makeover to be presentable to judges and the general student population - it only looked good enough to use by my and a few friends who didn't mind the fact that it wasn't the prettiest (they loved it because I made it, and I love them for that <3). Hence: SSC is born. The School Schedule Clock.

Development started on December 9, 2024 and ended on December 30, 2024, with the exception of a bugfix in January 2025. Notice how everything was made in under a month, while CHHS Clock was made over a year of on-and-off coding. SSC also featured so many things that CHHS Clock only dreamed about.

THEMES! These were finally a real thing! In CHHS Clock, it was dark/light based on your system theme. Here, you can choose dark, light, or even exotic purple (I like exotic purple, it's such a fun theme).

WIDGETS! CHHS Clock didn't even envision these. Now, you can open a stopwatch and timer, right in your clock view! How cool is that?!

Loading screen, specially composed ringing sounds for the timer, 24 hour time, and more. A lot of new stuff.

The main selling point of SSC is that it wasn't tied to CHHS. You could input your own schedule, which days it was on, and it would remember. You could share your schedules and import other people's schedules. This was a step towards where I am now, with the ability to switch schedules based on your school. But let's not jump ahead.

SSC was a great website and people at my school were intrigued. The only point that made me sad was that people at MY school *could* be using CHHS Clock, which would automatically be synced to the actual schedule (including late starts, exception days/overrides, etc.), but then they'd lose out on all of the benefits of SSC. No more widgets, no more themes, not even 24 hour time. They either imperfectly (and painstakingly) enter their schedule or lose out on the benefits. If only I had something that was the best of both worlds... (my foreshadowing is so bad :SOBS:)

Because this was a science fair project, it didn't get much development time after the science fair. Actually, it would've, but it didn't perform so well in the fair. It wasn't because it was made badly or anything, it was actually well constructed and well received by students and teachers alike. I simply didn't sell it good enough to the judges and there were issues with the presentation. That's the past. I decided to revamp my project for next year's science fair, but this time, it'd be BIGGER and BETTER. And with a good presentation and everything too, lol.

This brings me to the next step in the road to a school clock.

### lraj22/timecheck22 - TimeCheck 22

Hey, we're here! Development started on July 6, 2025, and the main work done that day was setup stuff that I was learning in a course about software engineering. I decided to actually create a Software Requirements Specification (SRS) document, the way I had learned it in the course. You can actually still find it [here somewhere](./SRS.md). This honestly did help me keep my work organized and focused.

Since this was once again written completely from scratch (remember, science fair one-year limitation), I started with nothing except wisdom from previous projects. Anyways, I did really want this to be way better than last year, because I wanted to do well in the fair. Everything that I had made for SSC went from "Done" to "To-do". It took all the way to September 13, 2025 for TC22 to even know what period it was in! That's over 2 months for something so "simple".

After that, though, work sped up because I was working on this for Siege, a 10-week (technically 14-week) program where one has to work on a project for 10 hours each week. It doesn't have to be the same project every week, although I did TimeCheck 22 many of those weeks. By September 28, 2025, TC22 had basically caught up to SSC in terms of features.

Saying it caught up is a bit of an understatement. Sure, it had all the features of SSC, but the reason it took so long is because it was gaining its own features. You can select from various schools - CHHS (my school), Always HS (a fake school used for testing purposes; named so because it's always doing something), and even CAPA (first partner school!). It was capable of reloading context every time someone switched schools in the sidebar. Did I hear that right? Sidebar! This is the first time a sidebar has ever been present.

TimeCheck 22 had a lot of new stuff that SSC never had, and now it has all of the features of SSC while still having the ease of CHHS Clock. (Haha, did you notice how this connects back to the foreshadowing?) Finally! Something usable that I can give to all my friends. It looks good, works fine, and has all the features!

However, I wasn't done. The plan for TimeCheck 22 is a lot bigger than that of SSC or CHHS Clock. Remember, I need to make something BIG for the science fair.

The idea: since many schools will participate, people from those schools will need to update context as needed. They are the School Managers! I am the School Manager for CHHS, and yes, technically for Always HS too. There should be a tool for the School Managers to easily edit their school's context, in case they're not intimately familiar with JSON documents like me.

With this tool, it will be easy to onboard new Managers, and therefore new schools! Then TC22 will grow and... Wait, what's that? Is that... the present? Oh, I guess I didn't tell you guys yet. While you were reading this, I've been getting closer and closer to the present day, and now apparently we're here. Right now, I'm working on the tool to help School Managers. It's not easy to make and is currently requiring a redesign of `context.json` which you can find in the above section (version 2!!!). That also means the science fair is coming up, and this is what I will be working on until then. If you want to ask me any questions or keep up with progress, feel free to contact me! Oh, and wish me luck with the science fair :]]]

I love you all and will keep you updated here! Thanks for reading <3
