# Science Fair Documentation

Hi! I'm going to be documenting some science fair information here. It is not directly relevant to the development otherwise, but it's good to include with the project.

## Risk Assessment

1. Identify and assess the risks and hazards involved in this project.

Since the only equipment I will be using is a regular personal computer, which is generally considered to be safe under normal circumstances, I don't face much physical risk. However, there is the legal danger of using copyrighted code when researching for solutions online, and also the digital danger of malware when using the internet for research purposes. Finally, there is a legal risk when collecting analytics on my website.

2. 
	a. List all hazardous chemicals, activities or devices to be used
	
	No chemicals will be used. The only device used is a regular personal computer, which is not considered hazardous. The activities being performed on the computer are not considered hazardous, as they are pretty normal and regular activities such as researching, coding, etc.
	
	b. identify and list all microorganisms to be used that are exempt from pre-approval (see Potentially Hazardous Biological Agent rules).
	
	No microorganisms will be used. I mean, there is the risk of computer viruses, and precautions will be taken to stay safe from them, but I'm pretty sure that's not what this section is about.

3. Describe the safety precautions and procedures that will be used to reduce the risks. If you conducted field work, include permits received and safety plans, as applicable.

To avoid potential copyright issues, I will adapt any code used as necessary to make it my own. To avoid digital danger, I will also avoid suspicious websites and links while researching, and I will have an antivirus installed to limit damage if malware does somehow run. I will also ensure that my analytics platform is privacy-respecting and legally compliant in order to avoid any legality issues when collecting data.

4. Describe the specific disposal procedures that will be used (when applicable).

Disposal procedures are not applicable here.

5. List the source(s) of safety information.

I'll be honest, most of the safety information here is just general computer safety, so here are some links to accompany and support the information above.
Considerations when copy-pasting code: https://www.mend.io/blog/copy-and-paste-code/
General computer safety: https://usa.kaspersky.com/resource-center/preemptive-safety/top-10-internet-safety-rules-and-what-not-to-do-online

## Research Plan/Project Summary

Rationale: a brief synopsis of the background that supports your research problem and explain why this research is important and if applicable, explain any societal impact of your research

> I am making a useful, feature-filled website that will be accessible to the public. There are many stages of software engineering that I will go through, such as designing a user interface (UI), prioritizing features that matter, and actually coding the website so that it is usable, efficient, and looks nice. Each part requires research in order to do it well. Researching what UI choices work well helps better users' experience. Researching alternatives clarifies what are important features to prioritize. And since no developer knows it all off the top of their head, researching during development is absolutely critical to get efficient and working code written. The product of all this research is well-written code that others can find (open source) and benefit from when writing their own programs.

### RESEARCH QUESTION

Includes hypothesis(es), expected outcomes, and engineering goals. How are they based on the rationale above?

Hypothesis

> HYPOTHESIS: Limiting the flexibility of choosing what schedule to follow, while increasing the ease of use and feature list, will result in a better user experience than the previous method of allowing free reign over schedule creation and lacking ease of use.
> 
> In last year's project, the School Schedule Clock (SSC), users could define their own schedules, period by period, day by day. My new project, TimeCheck 22 (TC22), only allows you to pick your school. However, this limitation enables the app to provide much more useful information like detailed daily schedules, anomalous schedule days (like rallies), and just more context. This distinction aligns with the above rationale, because research can aid me to find the best balance of limitation (between no control and full control) by observing other solutions and common user needs in this space.

Expected Outcomes

> PREDICTION: If students are limited to selecting their school, and not given the full schedule creation capabilities, then they will find the app more usable and even more useful than before.
> 
> I expect students who use my new project, TimeCheck 22 (TC22), to find it easier to use/understand and more useful overall, because it will feature less complexity while giving them more value. In SSC, the user wrote their own schedules, and TC22 simplifies that by giving predefined schedules by school, which will hopefully increase the number of users who find it useful and therefore continue using it.

Engineering Goal

> The engineering goal is to create an app that fulfills the purpose, scope, and constraints outlined in the Software Requirements Specification (SRS) document while achieveing the needs described by the user requirements. The SRS can be found in the code documentation files, but in short, the goal is "to enable students & teachers to easily and effectively use the customizable clock to track the time as it passes during school". Further details are provided in the SRS, including the requirements, which are the tasks to be done to meet completion.

### PROCEDURES

Detail all procedures and experimental design including methods for data collection, and when applicable, the source of data used.

Experimental Design

> First, I wrote the Software Requirements Specification (SRS) document, which details the objectives of the project. Based off of those goals and constraints, I wrote user stories, which are real life examples of what various users/stakeholders actually want. Then, I prioritize those user stories and work on the most important ones first, going on until all of them are done. This design flow ensures I'm spending my time working on what matters most to the stakeholders, and not on side features that don't really matter. This continues until the final product is something all users are happy with.

Methods for Data Collection

> To collect data, I will use Umami, which is a data analytics platform. It can be thought of like Google Analytics, except it is much more privacy-respecting, doesn't sell the analytics data to the highest bidder, and is compliant with many standards like the GDPR. The method for actually collecting data is simply adding a tag inside my website's code, which will run the analytics code when the site loads. This records how many visits I get, which pages were visited, and how long they stayed.

Source of Data

> As mentioned before, the source of the data is Umami. The Umami analytics snippet runs when the users load TimeCheck 22 into their web browser, and it reports back useful analytics data that helps me see whether users were actually engaged with the website or just looked and left. I can view this data in the Umami analytics dashboard or export it locally for analysis. This data is anonymous/non-identifiable.

### RISK AND SAFETY

Potential Risk

> Since the only equipment I will be using is a regular personal computer, which is generally considered to be safe under normal circumstances, I don't face much physical risk. However, there is the legal danger of using copyrighted code when researching for solutions online, and also the digital danger of malware when using the internet for research purposes. Finally, there is a legal risk when collecting analytics on my website. I face no risk from hazardous chemicals, activities, devices, or microorganisms (the hazardous agents mentioned in Form 3, "Risk Assessment"), since I don't deal with any of those in my project.

Safety Precautions

> To avoid potential copyright issues, I will adapt any code used as necessary to make it my own. To avoid digital danger, I will also avoid suspicious websites and links while researching, and I will have an antivirus installed to limit damage if malware does somehow run. I will also ensure that my analytics platform is privacy-respecting and legally compliant in order to avoid any legality issues when collecting data.

### DATA ANALYSIS

Describe the procedures you will use to analyze the results.

> I will use the filters provided in the Umami analytics dashboard to compare how the website is performing over time, and this data can be compared with assumptions on how SSC is performing. I didn't add analytics to SSC, so it's hard to know how well it's doing, but I did get a sense of how people liked it. The data analysis will see if the reactions to TC22 are better than that of SSC, and if the usage analytics match the image the visible reactions produced, i.e. do people use TC22 if they seem to be excited about the idea of it? Since the data is already nicely provided and formatted, I will not need to do much data transformation for analyzing it.

Bibliography

> Most of the content written here is based on what I know. However, here are some links to back up what I say.
> Stack Overflow, a common place to find answers to coding problems (research rationale section): https://stackoverflow.com/
> General computer safety (risk and safety sections): https://www.lifewire.com/computer-safety-tips-153314
> Umami privacy features, scroll down to Privacy (data analysis section): https://umami.is/features
