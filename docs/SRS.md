# Software Requirements Specification (SRS) Document

Project: TimeCheck 22 ([lraj22/timecheck22][repo])<br/>
Maintainer: Lakshya Raj ([lraj22][lraj22])

## Introduction

**Purpose**: to enable students & teachers to easily and effectively use the customizable clock to track the time as it passes during school

**Audience**: primarily students, but teachers are also a potential target audience

**Intended Usage**: during school, in class/passing between classes on a Chromebook, phone, personal computer, or ViewSonic

**Scope**
- Makes it easy to see time over/time remaining in period
- Select your school (if available) or add your own custom schedule
- Have extra tools like stopwatch/timer
- Be extra customizable

## Description

**Stakeholders**
- End users (students): watch the time, use the widgets, & customize
- End users (teachers): display the time, use the widgets, & customize
- Schedule managers (select students): edit school schedule, broadcast messages to end users within school
- Developer/System admin (me): manage schools, manage schedule managers, control access, broadcast messages to all users

**Constraints**: project should work in all of the following conditions
- small screen size (phone)
- large screen size (Chromebook/PC)
- extra large screen size (TV/ViewSonic)
- offline

**Assumptions**: all users should be using a Chromebook, phone, up-to-date personal computer, or ViewSonic, and may be broadcasted to other devices such as a TV screen; in other words, they should have an up-to-date browser and reasonable screen dimensions

**Dependencies**: localforage for local data storage purposes

## Requirements

Functional Requirements (provide some sort of functionality)
- Allow the user to select & switch schools
- Allow the user to use widgets like stopwatch and timer
- Allow the user to customize the clock interface

External Interface Requirements (how it interfaces with user/hardware/other software)
- Intuitive Interface

System Features (requirements for the system to function)
- Up-to-date browser
- Reasonable screen dimensions

Nonfunctional Requirements (performance, safety, security, usability, scalability, etc.)
- Must load relatively quickly (no noticeable/annoying load)
- Should be equally usable across platforms

See the project associated with the GitHub repository for requirements in user story style.

## Questions?

This document will be updated as requirements come in, users have varying demands, and the project evolves and improves.

Questions for me? Any suggestions for this SRS? You can contact me directly or post an issue on the [GitHub repo][repo].

[repo]: https://github.com/lraj22/timecheck22
[lraj22]: https://github.com/lraj22
