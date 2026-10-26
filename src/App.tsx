import { useState, useMemo, useEffect } from "react";
import type { CSSProperties } from "react";
import { Page, Section, Text, Table, Segmented, Callout, Button, Status, useGrokTheme } from "./kit";

type OldStatus = "Live" | "Down" | "None" | "Unknown";
type FlagTone = "success" | "warning" | "danger";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
  unknown?: boolean;
  note?: string;
  display?: string;
}

type Week = Partial<Record<DayKey, DayHours>>;

interface Biz {
  id: string;
  name: string;
  town: string;
  owner: string;
  oldUrl: string;
  oldStatus: OldStatus;
  oldNote: string;
  demoUrl: string;
  updated: string; // ISO, Central
  updatedLabel: string;
  stage: string;
  repo: string;
  repoUrl?: string;
  route: boolean;
  defaultView?: "morning" | "afternoon";
  walkOrder: number;
  slot: string;
  window: string;
  address: string;
  hoursThu: string;
  flag: string;
  flagTone: FlagTone;
  notes: string;
  hours: Week;
  hoursVerified: boolean;
  hoursSource: string;
  plannedWalk?: { day: DayKey; time: string };
}

const DAYS: [DayKey, string][] = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

const DAY_NAMES: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const START_TIMES = Array.from({ length: 17 }, (_, i) => 8 * 60 + i * 30);
const ROUTE_PREFS_KEY = "websiteHub.routePreferences.v1";
const MEETING_DURATION_MINUTES = 10;
// Last downtown stop arrives 90 minutes after the selected start; allow 10 minutes for that meeting.
const ROUTE_DURATION_MINUTES = 100;
const DEFAULT_ROUTE_DAY: DayKey = "thu";
const DEFAULT_ROUTE_START_TIME = 13 * 60;

const loadRoutePreferences = (): { selectedDay: DayKey; startTime: number } => {
  try {
    const raw = JSON.parse(localStorage.getItem(ROUTE_PREFS_KEY) ?? "null") as Record<string, unknown> | null;
    const savedDay = raw?.selectedDay;
    const savedTime = Number(raw?.startTime);
    return {
      selectedDay: typeof savedDay === "string" && DAYS.some(([key]) => key === savedDay)
        ? savedDay as DayKey
        : DEFAULT_ROUTE_DAY,
      startTime: START_TIMES.includes(savedTime) ? savedTime : DEFAULT_ROUTE_START_TIME,
    };
  } catch {
    return { selectedDay: DEFAULT_ROUTE_DAY, startTime: DEFAULT_ROUTE_START_TIME };
  }
};

const every = (h: DayHours): Week => ({ mon: h, tue: h, wed: h, thu: h, fri: h, sat: h, sun: h });

const BIZ: Biz[] = [
  {
    id: "pub",
    name: "The Pub at Pleasant Springs",
    town: "Stoughton",
    owner: "Abbey Bailey (license agent, likely owner)",
    oldUrl: "http://www.pleasantspringspub.com",
    oldStatus: "Down",
    oldNote: "Times out. Facebook is their only working presence.",
    demoUrl: "https://projectpops.vercel.app",
    updated: "2026-10-16T22:26",
    updatedLabel: "Oct 16, 10:26 PM",
    stage: "Demo built",
    repo: "WSO",
    route: true,
    walkOrder: 1,
    slot: "1:00 PM",
    window: "Mon–Thu 1:30–4:00 PM",
    address: "2630 County Hwy N",
    hoursThu: "11 AM–11 PM",
    flag: "Open, but before best window. Drive 10–12 min downtown after.",
    flagTone: "warning",
    notes: "Drive-to stop on County Hwy N, 10–12 min from downtown. Vercel project is named project_wso.",
    hours: {
      mon: { open: "11:00", close: "22:00" },
      tue: { open: "11:00", close: "22:00" },
      wed: { open: "11:00", close: "23:00" },
      thu: { open: "11:00", close: "23:00" },
      fri: { open: "11:00", close: "00:00" },
      sat: { open: "11:00", close: "22:00" },
      sun: { open: "11:00", close: "22:00" },
    },
    hoursVerified: true,
    hoursSource: "Published directory hours; call to verify before walking in",
  },
  {
    id: "olson",
    name: "Olson Heating & Sheet Metal",
    town: "Stoughton",
    owner: "Mike & Jennifer Olson",
    oldUrl: "https://www.olsonheatingsheetmetals.com",
    oldStatus: "Live",
    oldNote: "",
    demoUrl: "https://olson-heating-site.vercel.app",
    updated: "2026-10-25T19:08",
    updatedLabel: "Oct 25, 7:08 PM",
    stage: "Homepage updated · deployed",
    repo: "olson-heating-site",
    route: true,
    walkOrder: 2,
    slot: "1:30 PM",
    window: "Tue–Thu 8:00–10:30 AM (alt 3–5 PM)",
    address: "251 W Main St",
    hoursThu: "8 AM–5 PM",
    flag: "Open, but outside best window",
    flagTone: "warning",
    notes: "Ask for Jennifer; Mike is usually out on jobs. Oct 25: homepage replaced with the new design and deployed; interior pages unchanged. The new design uses 608-873-3612; confirm phone, copy, image rights and emergency-service wording before the live-domain launch.",
    hours: {
      mon: { open: "08:00", close: "17:00" },
      tue: { open: "08:00", close: "17:00" },
      wed: { open: "08:00", close: "17:00" },
      thu: { open: "08:00", close: "17:00" },
      fri: { open: "08:00", close: "17:00" },
      sat: { closed: true },
      sun: { closed: true },
    },
    hoursVerified: true,
    hoursSource: "Official company site: Mon–Fri 8 AM–5 PM; weekends closed",
  },
  {
    id: "sotw",
    name: "Smokes on the Water",
    town: "Stoughton",
    owner: "Chris Kelley",
    oldUrl: "https://www.smokesonthewaterwi.com",
    oldStatus: "Live",
    oldNote: "",
    demoUrl: "https://smoke-on-the-water.vercel.app",
    updated: "2026-10-21T18:07",
    updatedLabel: "Oct 21, 6:07 PM",
    stage: "Demo built",
    repo: "Smoke-On-The-Water",
    route: true,
    walkOrder: 3,
    slot: "1:42 PM",
    window: "Tue–Thu 1:00–4:00 PM",
    address: "233 W Main St",
    hoursThu: "10 AM–9 PM",
    flag: "Open, in best window",
    flagTone: "success",
    notes: "Owner often not in; get his email from the counter.",
    hours: every({ open: "10:00", close: "21:00" }),
    hoursVerified: true,
    hoursSource: "Downtown Stoughton Merchant Association lists Smokes on the Water daily 10 AM–9 PM; corroborated by a public Nextdoor business listing.",
  },
  {
    id: "chiro",
    name: "Abundant Health Chiropractic",
    town: "Stoughton",
    owner: "Dr. Grayson Cline",
    oldUrl: "https://www.ahchirowellness.com",
    oldStatus: "Live",
    oldNote: "",
    demoUrl: "https://abundant-health-chiropractic.vercel.app",
    updated: "2026-10-24",
    updatedLabel: "Oct 24, 2026",
    stage: "Redesign live",
    repo: "abundancehealth",
    route: true,
    walkOrder: 4,
    slot: "1:54 PM",
    window: "Tue or Thu 12:00–3:00 PM",
    address: "318 S Water St",
    hoursThu: "9 AM–7 PM",
    flag: "Open, in best window",
    flagTone: "success",
    notes: "Redesign preview is live. Code is on GitHub; Vercel is not yet connected for automatic Git deploys.",
    hours: {
      mon: { open: "07:30", close: "17:30" },
      tue: { open: "09:00", close: "19:00" },
      wed: { open: "07:30", close: "17:30" },
      thu: { open: "09:00", close: "19:00" },
      fri: { open: "08:00", close: "16:30" },
      sat: { open: "08:00", close: "12:30" },
      sun: { closed: true },
    },
    hoursVerified: true,
    hoursSource: "Official practice site hours; appointment-based care",
  },
  {
    id: "roxys",
    name: "Roxy's Restobar",
    town: "Stoughton",
    owner: "Trisha Brown",
    oldUrl: "https://sites.google.com/view/roxys/home",
    oldStatus: "Live",
    oldNote: "Bare Google Sites page. The site on her Google listing (business.site) is dead.",
    demoUrl: "https://roxys-restobar.vercel.app",
    updated: "2026-10-25T09:23",
    updatedLabel: "Oct 25, 9:23 AM",
    stage: "Demo built",
    repo: "Roxys-Restobar",
    route: true,
    walkOrder: 5,
    slot: "2:06 PM",
    window: "Tue–Thu 3:00–5:00 PM",
    address: "208 W Main St",
    hoursThu: "2 PM–2 AM",
    flag: "Open (opened 2 PM), but before best window",
    flagTone: "warning",
    notes: "Best prospect on the route. Second bar licensed July 2026. Redesigned Oct 21 (darker, adult gig-poster look); repo linked to Vercel with daily rebuild.",
    hours: {
      mon: { open: "14:00", close: "02:00" },
      tue: { open: "14:00", close: "02:00" },
      wed: { open: "14:00", close: "02:00" },
      thu: { open: "14:00", close: "02:00" },
      fri: { open: "14:00", close: "02:00" },
      sat: { open: "14:00", close: "02:30" },
      sun: { open: "12:00", close: "02:00", display: "12 PM–2 AM (one listing says 2:30 AM)" },
    },
    hoursVerified: false,
    hoursSource: "Downtown Stoughton Merchant Association lists Sunday noon–2 AM; Restaurantji lists noon–2:30 AM. Use 2 AM as the conservative listed close pending direct confirmation.",
  },
  {
    id: "gemini",
    name: "Gemini Games",
    town: "Stoughton",
    owner: "Current owner unknown (opened 2019 by Brianna & Tyler Fero)",
    oldUrl: "https://www.facebook.com/geminigamingstoughton",
    oldStatus: "Live",
    oldNote: "Facebook page. geminigamingstoughton.com just redirects there.",
    demoUrl: "https://gemini-games-ten.vercel.app",
    updated: "2026-10-22",
    updatedLabel: "Oct 22",
    stage: "Demo built",
    repo: "gemini-games",
    route: true,
    walkOrder: 6,
    slot: "2:18 PM",
    window: "Not set",
    address: "193 W Main St",
    hoursThu: "2–9 PM",
    flag: "Open at arrival",
    flagTone: "success",
    notes: "Phone (608) 719-5077.",
    hours: {
      mon: { open: "14:00", close: "21:00" },
      tue: { open: "14:00", close: "21:00" },
      wed: { open: "14:00", close: "21:00" },
      thu: { open: "14:00", close: "21:00" },
      fri: { open: "14:00", close: "22:00" },
      sat: { open: "12:00", close: "22:00" },
      sun: { open: "12:00", close: "21:00" },
    },
    hoursVerified: true,
    hoursSource: "Downtown Stoughton directory: Mon–Thu 2–9 PM; Fri 2–10 PM; Sat 12–10 PM; Sun 12–9 PM",
  },
  {
    id: "mershons",
    name: "Mershon's Cider",
    town: "Stoughton",
    owner: "Joseph Baird (founder)",
    oldUrl: "https://mershonscider.com",
    oldStatus: "Live",
    oldNote: "",
    demoUrl: "https://mershons-cider.vercel.app",
    updated: "2026-10-22T12:43",
    updatedLabel: "Oct 22, 12:43 PM",
    stage: "Demo built",
    repo: "Mershons-Cider",
    route: true,
    walkOrder: 7,
    slot: "2:30 PM",
    window: "Not set",
    address: "124 W Main St",
    hoursThu: "2–8 PM (tasting room; one listing says 2–7)",
    flag: "Open at arrival",
    flagTone: "success",
    notes: "124 W Main St. Redesign keeps their colors, vibe and pages; Our Story trimmed by about half. Page transitions, scroll reveals and hover effects added Oct 22. Forms open email until a form service is added.",
    hours: {
      mon: { closed: true },
      tue: { closed: true },
      wed: { open: "14:00", close: "20:00" },
      thu: { open: "14:00", close: "20:00" },
      fri: { open: "14:00", close: "20:00" },
      sat: { open: "12:00", close: "20:00" },
      sun: { open: "12:00", close: "17:00" },
    },
    hoursVerified: true,
    hoursSource: "Official tasting-room page: Wed–Fri 2–8 PM, Sat 12–8 PM, Sun 12–5 PM",
  },
  {
    id: "sga",
    name: "Stoughton Gymnastics",
    town: "Stoughton",
    owner: "Jessica Kohlhoff",
    oldUrl: "https://www.stoughtongymnastics.com",
    oldStatus: "Live",
    oldNote: "Wix site.",
    demoUrl: "https://stoughton-gymnastics.vercel.app",
    updated: "2026-10-21T18:05",
    updatedLabel: "Oct 21, 6:05 PM",
    stage: "Demo built",
    repo: "Stoughton-Gymnastics",
    route: false,
    walkOrder: 8,
    slot: "",
    window: "Mon–Thu 3:15–4:15 PM",
    address: "201 W Main St",
    hoursThu: "3:30–9 PM",
    flag: "Opens 3:30 PM, after you leave at 2:45.",
    flagTone: "warning",
    notes: "Closed Fri–Sun. Catch her at the 3:30 open, before kids arrive. Phone (608) 888-2858.",
    hours: {
      mon: { open: "15:30", close: "21:00" },
      tue: { open: "15:30", close: "21:00" },
      wed: { open: "15:30", close: "21:00" },
      thu: { open: "15:30", close: "21:00" },
      fri: { closed: true },
      sat: { closed: true },
      sun: { closed: true },
    },
    hoursVerified: true,
    hoursSource: "Listed hours: Mon–Thu 3:30–9 PM; Fri–Sun closed; verify by phone",
  },
  {
    id: "wst",
    name: "Water Street Tavern",
    town: "Stoughton",
    owner: "Patti & Chuck Cross",
    oldUrl: "https://waterstreettavernstoughton.com",
    oldStatus: "Live",
    oldNote: "GoDaddy builder site.",
    demoUrl: "https://water-street-tavern.vercel.app",
    updated: "2026-10-21T15:03",
    updatedLabel: "Oct 21, 3:03 PM",
    stage: "Demo built",
    repo: "Water-Street-Tavern",
    route: false,
    walkOrder: 9,
    slot: "",
    window: "Thu 3:00–5:00 PM",
    address: "324 S Water St",
    hoursThu: "4–9:30 PM (bar and dinner)",
    flag: "Opens 4 PM, after you leave at 2:45.",
    flagTone: "warning",
    notes: "Closed Mon–Tue. If owners are out, ask for Matt Adkins (operations manager). Phone (608) 480-4001.",
    hours: {
      mon: { closed: true },
      tue: { closed: true },
      wed: { open: "16:00", close: "21:30", display: "Bar 4–9:30 PM; kitchen 4–9 PM" },
      thu: { open: "16:00", close: "21:30", display: "Bar 4–9:30 PM; kitchen 4–9 PM" },
      fri: { open: "16:00", close: "21:30", display: "Bar 4–9:30 PM; kitchen 4–9 PM" },
      sat: { open: "09:00", close: "21:30", display: "Bar 9 AM–9:30 PM; kitchen 9–2, 4–9" },
      sun: { open: "09:00", close: "14:00", display: "Bar & brunch 9 AM–2 PM" },
    },
    hoursVerified: true,
    hoursSource: "Official website: closed Mon/Tue; Wed–Fri bar 4–9:30 PM; Sat bar 9 AM–9:30 PM; Sun bar 9 AM–2 PM. Kitchen hours differ on Saturday.",
  },
  {
    id: "ctk",
    name: "Christ the King Community Church",
    town: "Stoughton",
    owner: "Pastor Jason Miller (lead pastor)",
    oldUrl: "https://www.christthekingcc.org",
    oldStatus: "Live",
    oldNote: "Existing website is live; custom redesign preview is ready to review.",
    demoUrl: "https://christ-the-king-community.vercel.app",
    updated: "2026-10-25",
    updatedLabel: "Oct 25, 2026",
    stage: "Demo built",
    repo: "christ-the-king-community",
    route: false,
    walkOrder: 10,
    slot: "",
    window: "Planned walk Mon Oct 26, 2:00 PM (not a published opening hour)",
    address: "401 W Main St",
    hoursThu: "3–8:30 PM",
    flag: "Planned sales-walk Mon Oct 26 at 2:00 PM falls before listed opening at 3 PM. Call first or arrive after 3 PM.",
    flagTone: "warning",
    notes: "Phone (608) 877-0303. Call ahead to confirm Pastor Jason or another decision-maker is available. Show the church redesign and discuss clearer visitor info, ministries, sermons, calendar and contact access.",
    hours: {
      mon: { open: "15:00", close: "20:30" },
      tue: { open: "08:00", close: "10:30" },
      wed: { open: "15:00", close: "20:30" },
      thu: { open: "15:00", close: "20:30" },
      fri: { open: "08:00", close: "10:30" },
      sat: { closed: true },
      sun: { open: "10:00", close: "12:00" },
    },
    hoursVerified: true,
    hoursSource: "Public listing indexed by ChurchesList says these hours are from the church's Google Business Profile (updated June 2026); the church's own site also lists its Sunday service at 10 AM. Call ahead before a sales visit.",
    plannedWalk: { day: "mon", time: "14:00" },
  },
  {
    id: "mpat",
    name: "Main & Page Auto & Towing",
    town: "Stoughton",
    owner: "Owner/contact not confirmed",
    oldUrl: "https://mainpageauto.com",
    oldStatus: "Unknown",
    oldNote: "Listed as the current website; live availability not independently confirmed.",
    demoUrl: "https://main-page-auto-towing.vercel.app",
    updated: "2026-10-25T19:10",
    updatedLabel: "Oct 25, 7:10 PM",
    stage: "Demo built",
    repo: "real_mdp / main-page-auto-towing",
    repoUrl: "https://github.com/madisondesignprojects-ship-it/real_mdp/tree/main/main-page-auto-towing",
    route: false,
    walkOrder: 11,
    slot: "",
    window: "Weekdays 7 AM–4 PM (repair shop); call first",
    address: "304 W Main St",
    hoursThu: "7 AM–4 PM (shop; towing listed 24/7)",
    flag: "Repair-shop listing shows Mon–Fri 7 AM–4 PM, closed weekends; other listings advertise 24-hour towing. Confirm walk-in availability before visiting.",
    flagTone: "warning",
    notes: "Phone conflict: local directories list (608) 334-3672, BBB lists (608) 723-8611. Services listed: auto repair, brakes, oil changes, A/C, transmission and truck repair, towing and recovery, lockouts, jump starts.",
    hours: {
      mon: { open: "07:00", close: "16:00" },
      tue: { open: "07:00", close: "16:00" },
      wed: { open: "07:00", close: "16:00" },
      thu: { open: "07:00", close: "16:00" },
      fri: { open: "07:00", close: "16:00" },
      sat: { closed: true },
      sun: { closed: true },
    },
    hoursVerified: false,
    hoursSource: "Loc8NearMe lists the repair shop Mon–Fri 7 AM–4 PM and closed weekends; other directories show 24-hour towing/roadside service. These may be different service hours, so call before visiting.",
  },
  {
    id: "brickworks",
    name: "Brick Works Masonry",
    town: "Stoughton",
    owner: "Owner/contact not confirmed",
    oldUrl: "https://www.brickworksmasonry.com",
    oldStatus: "Unknown",
    oldNote: "Houzz lists this as the business website, but it could not be verified during the current check. Confirm whether the domain is still active before pitching.",
    demoUrl: "https://brick-works-masonry.vercel.app",
    updated: "2026-10-26",
    updatedLabel: "Oct 26, 2026",
    stage: "Demo built · confirm placeholders",
    repo: "Brick-Works-Masonry",
    route: false,
    defaultView: "morning",
    walkOrder: 13,
    slot: "",
    window: "Morning prospect · masonry contractor; confirm the decision-maker is available",
    address: "833 Garfield St",
    hoursThu: "7 AM–5 PM",
    flag: "Morning prospect. Call before visiting; this is a masonry contractor and the owner may be at a job site.",
    flagTone: "warning",
    notes: "Public listings show Brick Works Masonry LLC at 833 Garfield St, Stoughton, WI 53589. Phone numbers conflict: Houzz and DOT records list (608) 575-9364; Yellow Pages lists (608) 873-3810. The sample site contains placeholders that must be confirmed, and its four Google Business listing photos are for the pitch only until permission is confirmed.",
    hours: {
      mon: { open: "07:00", close: "17:00" },
      tue: { open: "07:00", close: "17:00" },
      wed: { open: "07:00", close: "17:00" },
      thu: { open: "07:00", close: "17:00" },
      fri: { open: "07:00", close: "17:00" },
      sat: { open: "08:00", close: "12:00" },
      sun: { open: "08:00", close: "12:00" },
    },
    hoursVerified: true,
    hoursSource: "Yellow Pages and Masonry Directory USA list Mon–Fri 7 AM–5 PM and Sat–Sun 8 AM–noon; call to confirm before visiting.",
  },
  {
    id: "ohbrothers",
    name: "OH! Brothers",
    town: "Stoughton",
    owner: "Owner/contact not confirmed",
    oldUrl: "",
    oldStatus: "None",
    oldNote: "No official business website identified yet; verify current web and social presence before pitching.",
    demoUrl: "https://oh-brothers.vercel.app",
    updated: "2026-10-26",
    updatedLabel: "Oct 26, 2026",
    stage: "Demo built",
    repo: "OH-Brothers",
    route: false,
    defaultView: "morning",
    walkOrder: 12,
    slot: "",
    window: "Business identity and hours unverified; confirm before visiting",
    address: "121 E Main St",
    hoursThu: "Unverified — business/address mismatch",
    flag: "Unable to verify OH! Brothers as a current business at this address. Public listings identify Wendigo at 121 E Main St; confirm the business identity before planning a visit.",
    flagTone: "warning",
    notes: "The project README describes OH! Brothers as a breakfast-and-lunch concept at 121 E Main St, but I could not find a current public listing for a business by that name. Current local listings identify Wendigo at this address. Do not assume Wendigo's hours belong to OH! Brothers; verify the intended business before visiting or pitching.",
    hours: every({ unknown: true }),
    hoursVerified: false,
    hoursSource: "No reliable public hours found because the business identity at 121 E Main St could not be verified; current listings identify Wendigo at that address.",
  },
];

interface Site {
  name: string;
  town: string;
  demoUrl: string;
  oldUrl: string;
  oldStatus: OldStatus;
  deployed: string;
  repo: string;
  notes: string;
}

const SITES: Site[] = [
  {
    name: "Preferred Carpet Cleaning",
    town: "Cottage Grove",
    demoUrl: "https://carpetcleanersmadison.vercel.app",
    oldUrl: "",
    oldStatus: "Unknown",
    deployed: "Oct 21, 7:23 PM",
    repo: "",
    notes: "No official site found; directory listings only. Directories list 360 Progress Dr Ste 205 and owner Scott Hosking.",
  },
  {
    name: "Rockwell Painting",
    town: "Stoughton",
    demoUrl: "https://rockwell-painting.vercel.app",
    oldUrl: "",
    oldStatus: "Unknown",
    deployed: "Oct 21, 6:14 PM",
    repo: "Rockwell-Painting",
    notes: "No current site found. BBB lists 1766 Drotning Rd and Vincent Rockwell, president.",
  },
  {
    name: "C. R. Laudolff Fine Carpentry",
    town: "Fond du Lac",
    demoUrl: "https://cr-laudolff-carpentry-preview.vercel.app",
    oldUrl: "http://crlaudolffcarpentry.com",
    oldStatus: "Down",
    deployed: "Oct 21, 6:14 PM",
    repo: "WW",
    notes: "Listed site did not load when checked Oct 26. Some listings place the business in Cottage Grove instead.",
  },
  {
    name: "Yahara Chocolate",
    town: "Stoughton",
    demoUrl: "https://yahara-chocolates-and-tea.vercel.app",
    oldUrl: "https://yaharachocolate.com",
    oldStatus: "Live",
    deployed: "Oct 21, 6:07 PM",
    repo: "Yahara-Chocolates-and-Tea",
    notes: "",
  },
  {
    name: "Covenant Lutheran Church",
    town: "Stoughton",
    demoUrl: "https://covluth-redesign.vercel.app",
    oldUrl: "https://covluth.org",
    oldStatus: "Live",
    deployed: "Oct 18, 6:38 PM",
    repo: "",
    notes: "",
  },
  {
    name: "Thundercat Fireworks",
    town: "Cottage Grove and Fitchburg",
    demoUrl: "https://thundercatfireworks.vercel.app",
    oldUrl: "",
    oldStatus: "Unknown",
    deployed: "Oct 18, 11:38 AM",
    repo: "Fireworks",
    notes: "Directory-listed sites (thundercatfireworkswi.com, thundercatfireworks.com, thundercatfireworks.net) did not load when checked Oct 26.",
  },
  {
    name: "Glow by Chlo",
    town: "",
    demoUrl: "https://glowbychlo.vercel.app",
    oldUrl: "",
    oldStatus: "Unknown",
    deployed: "Oct 15, 10:51 AM",
    repo: "est_poject",
    notes: "Current site not confirmed; the demo links to Instagram @glowbychlo.esthetics.",
  },
  {
    name: "Jeff's Guitar Clinic",
    town: "Stoughton",
    demoUrl: "https://jeffs-guitar-clinic.vercel.app",
    oldUrl: "https://jeffsguitar.com",
    oldStatus: "Live",
    deployed: "Oct 10, 4:09 PM",
    repo: "Jeffs_Guitar_Clinic",
    notes: "",
  },
];

const host = (u: string): string => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

const toMin = (s: string): number => {
  const [h, m] = s.split(":").map((x: string) => Number(x));
  return h * 60 + m;
};

const twelve = (s: string): string => {
  const [h, m] = s.split(":").map((x: string) => Number(x));
  const ap = h < 12 ? "AM" : "PM";
  const hh = h % 12 || 12;
  return `${hh}${m ? ":" + String(m).padStart(2, "0") : ""} ${ap}`;
};

const formatMinutes = (value: number): string => {
  const mins = ((value % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`;
};

const parseTwelve = (value: string): number => {
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return 13 * 60;
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return hour * 60 + Number(match[2] ?? 0);
};

const arrivalAt = (b: Biz, startTime: number): number =>
  startTime + parseTwelve(b.slot) - 13 * 60;

const dayText = (d: DayHours | undefined): string => {
  if (!d) return "Not confirmed";
  if (d.closed) return "Closed";
  if (d.unknown || !d.open || !d.close) return d.note ? "Listings differ" : "Not confirmed";
  return d.display ?? `${twelve(d.open)}–${twelve(d.close)}`;
};

const spans = (d: DayHours | undefined): [number, number][] => {
  if (!d || d.closed || d.unknown || !d.open || !d.close) return [];
  const a = toMin(d.open);
  const b = toMin(d.close);
  if (a === b) return [];
  return b > a ? [[a, b]] : [[a, 1440], [0, b]];
};

const overlaps = (a: number, b: number, c: number, d: number): boolean => Math.max(a, c) < Math.min(b, d);

type View = "all" | "morning" | "afternoon" | "saved";
type SortableTab = "morning" | "afternoon";

const inView = (b: Biz, v: View): boolean => {
  if (v === "all") return true;
  if (v === "saved") return false;
  if (b.defaultView) return b.defaultView === v;
  if (b.plannedWalk) {
    const t = toMin(b.plannedWalk.time);
    if (v === "morning" && t >= 360 && t < 720) return true;
    if (v === "afternoon" && (t >= 720 || t < 360)) return true;
  }
  return DAYS.some(([k]: [DayKey, string]) =>
    spans(b.hours[k]).some(([x, y]: [number, number]) =>
      v === "morning" ? overlaps(x, y, 360, 720) : overlaps(x, y, 720, 1440) || overlaps(x, y, 0, 360),
    ),
  );
};

interface Now {
  day: DayKey;
  mins: number;
}

const nowCentral = (): Now => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const p: Record<string, string> = {};
  parts.forEach((x: Intl.DateTimeFormatPart) => {
    p[x.type] = x.value;
  });
  return { day: p.weekday.toLowerCase().slice(0, 3) as DayKey, mins: Number(p.hour) * 60 + Number(p.minute) };
};

const prevDay = (d: DayKey): DayKey => {
  const i = DAYS.findIndex(([k]: [DayKey, string]) => k === d);
  return DAYS[(i + 6) % 7][0];
};

type OpenState = "open" | "closed" | "unknown";

const openState = (b: Biz, n: Now): OpenState => {
  const today = b.hours[n.day];
  const y = b.hours[prevDay(n.day)];
  // still open from an overnight close the day before
  if (y && y.open && y.close && !y.closed && !y.unknown && toMin(y.close) < toMin(y.open) && n.mins < toMin(y.close)) return "open";
  if (!today || today.unknown) return "unknown";
  if (today.closed || !today.open || !today.close) return "closed";
  const a = toMin(today.open);
  const c = toMin(today.close);
  const open = a < c ? n.mins >= a && n.mins < c : n.mins >= a;
  return open ? "open" : "closed";
};

const DEFAULT_ORDER: string[] = [...BIZ].sort((a: Biz, b: Biz) => a.walkOrder - b.walkOrder).map((b: Biz) => b.id);

// Reorder and remove choices are saved in this browser (localStorage).
const ORDER_KEY = "websiteHub.order.v1";
const REMOVED_KEY = "websiteHub.removed.v1";
const PLACEMENT_KEY = "websiteHub.placements.v1";
const SECTION_ORDER_KEY = "websiteHub.sectionOrders.v1";

const readIds = (key: string): string[] | null => {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(v) ? v.filter((x: unknown): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
};

const loadOrder = (): string[] => {
  const saved = readIds(ORDER_KEY);
  if (!saved) return DEFAULT_ORDER;
  const known = saved.filter((id: string) => DEFAULT_ORDER.includes(id));
  // stops added to the dashboard later go at the end of the saved order
  return [...known, ...DEFAULT_ORDER.filter((id: string) => !known.includes(id))];
};

const loadRemoved = (): string[] => (readIds(REMOVED_KEY) ?? []).filter((id: string) => DEFAULT_ORDER.includes(id));

const loadPlacements = (): Record<string, View> => {
  try {
    const raw = JSON.parse(localStorage.getItem(PLACEMENT_KEY) ?? "{}") as Record<string, unknown>;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const valid: Record<string, View> = {};
    Object.entries(raw).forEach(([id, value]) => {
      if (
        DEFAULT_ORDER.includes(id) &&
        (value === "all" || value === "morning" || value === "afternoon" || value === "saved")
      ) valid[id] = value;
    });
    return valid;
  } catch {
    return {};
  }
};

const loadSectionOrders = (): Partial<Record<SortableTab, string[]>> => {
  try {
    const raw = JSON.parse(localStorage.getItem(SECTION_ORDER_KEY) ?? "{}") as Record<string, unknown>;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: Partial<Record<SortableTab, string[]>> = {};
    (["morning", "afternoon"] as SortableTab[]).forEach((tab) => {
      const saved = raw[tab];
      if (Array.isArray(saved)) {
        const known = saved.filter((id: unknown): id is string => typeof id === "string" && DEFAULT_ORDER.includes(id));
        result[tab] = [...known, ...DEFAULT_ORDER.filter((id) => !known.includes(id))];
      }
    });
    return result;
  } catch {
    return {};
  }
};

export default function App() {
  const t = useGrokTheme();
  const [view, setView] = useState<View>("all");
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => loadRoutePreferences().selectedDay);
  const [startTime, setStartTime] = useState<number>(() => loadRoutePreferences().startTime);
  const [order, setOrder] = useState<string[]>(loadOrder);
  const [removed, setRemoved] = useState<string[]>(loadRemoved);
  const [placements, setPlacements] = useState<Record<string, View>>(loadPlacements);
  const [sectionOrders, setSectionOrders] = useState<Partial<Record<SortableTab, string[]>>>(loadSectionOrders);
  const [pending, setPending] = useState<string>("");
  const [now, setNow] = useState<Now>(nowCentral());

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      localStorage.setItem(REMOVED_KEY, JSON.stringify(removed));
      localStorage.setItem(PLACEMENT_KEY, JSON.stringify(placements));
      localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(sectionOrders));
    } catch {
      // storage unavailable (private mode); choices just last for this visit
    }
  }, [order, removed, placements, sectionOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(ROUTE_PREFS_KEY, JSON.stringify({ selectedDay, startTime }));
    } catch {
      // Storage may be unavailable in private browsing; selections last for this visit.
    }
  }, [selectedDay, startTime]);

  useEffect(() => {
    const id = setInterval(() => setNow(nowCentral()), 30000);
    return () => clearInterval(id);
  }, []);

  const routeStops = BIZ.filter((b: Biz) => b.route && !removed.includes(b.id) && placements[b.id] !== "saved").sort((a: Biz, b: Biz) => order.indexOf(a.id) - order.indexOf(b.id));

  const visible = useMemo<Biz[]>(() => {
    let list: Biz[];
    if (view === "saved") {
      list = BIZ.filter((b: Biz) => !removed.includes(b.id) && placements[b.id] === "saved");
    } else if (view === "all") {
      list = BIZ.filter((b: Biz) => !removed.includes(b.id) && placements[b.id] !== "saved");
    } else {
      list = BIZ.filter((b: Biz) =>
        !removed.includes(b.id) &&
        placements[b.id] !== "saved" &&
        (placements[b.id] ? placements[b.id] === view : inView(b, view)),
      );
    }

    const savedOrder = (a: Biz, b: Biz) => order.indexOf(a.id) - order.indexOf(b.id);
    if ((view === "morning" || view === "afternoon") && sectionOrders[view]) {
      const tabOrder = sectionOrders[view]!;
      const rank = (b: Biz) => {
        const index = tabOrder.indexOf(b.id);
        return index < 0 ? Number.MAX_SAFE_INTEGER : index;
      };
      list.sort((a: Biz, b: Biz) => rank(a) - rank(b) || savedOrder(a, b));
    } else if (view === "afternoon") {
      const openingMinute = (b: Biz): number => {
        const hours = b.hours[selectedDay];
        return !hours || hours.closed || hours.unknown || !hours.open
          ? Number.MAX_SAFE_INTEGER
          : toMin(hours.open);
      };
      list.sort((a: Biz, b: Biz) => openingMinute(a) - openingMinute(b) || savedOrder(a, b));
    } else {
      list.sort(savedOrder);
    }
    return list;
  }, [view, order, removed, placements, selectedDay, sectionOrders]);

  const peers = (_b: Biz): Biz[] => visible;

  const move = (b: Biz, delta: number): void => {
    const list = peers(b);
    const i = list.findIndex((x: Biz) => x.id === b.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;

    if (view === "morning" || view === "afternoon") {
      const nextTabOrder = list.map((item: Biz) => item.id);
      [nextTabOrder[i], nextTabOrder[j]] = [nextTabOrder[j], nextTabOrder[i]];
      const completeTabOrder = [
        ...nextTabOrder,
        ...(sectionOrders[view] ?? []),
        ...DEFAULT_ORDER,
      ].filter((id, index, all) => DEFAULT_ORDER.includes(id) && all.indexOf(id) === index);
      setSectionOrders({ ...sectionOrders, [view]: completeTabOrder });
      return;
    }

    const other = list[j].id;
    const next = order.slice();
    const pi = next.indexOf(b.id);
    const pj = next.indexOf(other);
    next[pi] = other;
    next[pj] = b.id;
    setOrder(next);
  };

  const remove = (id: string): void => {
    setRemoved([...removed, id]);
    setPending("");
  };

  const moveTo = (id: string, target: View): void => {
    setPlacements({ ...placements, [id]: target });
    setPending("");
    setView(target);
  };

  const reordered =
    order.some((id: string, i: number) => id !== DEFAULT_ORDER[i]) ||
    Boolean(sectionOrders.morning) ||
    Boolean(sectionOrders.afternoon);

  const resetOrder = (): void => {
    setOrder(DEFAULT_ORDER);
    setSectionOrders({});
  };

  const countFor = (v: View): number => {
    if (v === "saved") return BIZ.filter((b: Biz) => !removed.includes(b.id) && placements[b.id] === "saved").length;
    if (v === "all") return BIZ.filter((b: Biz) => !removed.includes(b.id) && placements[b.id] !== "saved").length;
    return BIZ.filter((b: Biz) =>
      !removed.includes(b.id) &&
      placements[b.id] !== "saved" &&
      (placements[b.id] ? placements[b.id] === v : inView(b, v)),
    ).length;
  };

  const statusColor = (s: OldStatus): string =>
    s === "Live" ? t.text.success : s === "Down" ? t.text.danger : t.text.tertiary;
  const flagColor = (f: FlagTone): string =>
    f === "success" ? t.text.success : f === "warning" ? t.text.warning : t.text.danger;

  const arrivalStatus = (b: Biz, arrival: number): OpenState => {
    const d = b.hours[selectedDay];
    if (!d || d.unknown) return "unknown";
    if (d.closed) return "closed";
    if (!d.open || !d.close) return "unknown";
    const open = toMin(d.open);
    const close = toMin(d.close);
    if (open === close) return "closed";
    return (open < close ? arrival >= open && arrival < close : arrival >= open || arrival < close)
      ? "open"
      : "closed";
  };

  const routeMessage = (b: Biz): string => {
    const status = arrivalStatus(b, arrivalAt(b, startTime));
    if (status === "open") {
      return selectedDay === "thu" && startTime === 13 * 60 ? b.flag : "Open at planned arrival";
    }
    return status === "closed" ? "Closed at planned arrival" : "Hours for this day are not confirmed";
  };

  const routeMessageTone = (b: Biz): FlagTone => {
    const status = arrivalStatus(b, arrivalAt(b, startTime));
    return status === "open" ? "success" : status === "closed" ? "danger" : "warning";
  };

  const linkBtn = (primary: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: t.radius.md,
    border: `1px solid ${primary ? t.fill.accent : t.border.default}`,
    background: primary ? t.fill.accent : "transparent",
    color: primary ? t.text.onColor : t.text.primary,
    textDecoration: "none",
    fontSize: t.font.body2.fontSize,
    lineHeight: t.font.body2.lineHeight,
    fontWeight: t.weight.medium,
    maxWidth: "100%",
    overflowWrap: "anywhere",
  });

  const label: CSSProperties = {
    fontSize: t.font.label.fontSize,
    lineHeight: t.font.label.lineHeight,
    color: t.text.tertiary,
  };
  const small: CSSProperties = {
    fontSize: t.font.body2.fontSize,
    lineHeight: t.font.body2.lineHeight,
    color: t.text.secondary,
  };

  const a = (href: string, text: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: t.text.accent, textDecoration: "none", fontWeight: t.weight.medium }}>
      {text}
    </a>
  );

  const weekGrid = (b: Biz) => (
    <div style={{ marginTop: 10 }}>
      <div style={label}>
        Weekly hours · {b.hoursVerified ? "source checked" : b.hoursSource.toLowerCase().includes("conflict") ? "conflicting listings" : b.hoursSource.toLowerCase().includes("user") ? "user-provided hours" : "not publicly posted"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {DAYS.map(([k, name]: [DayKey, string]) => {
          const d = b.hours[k];
          const isToday = k === now.day;
          const muted = !d || d.closed || d.unknown || !d.open;
          return (
            <div
              key={k}
              style={{
                ...small,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 88,
                boxSizing: "border-box",
                padding: "6px 8px",
                borderRadius: 8,
                border: `1px solid ${isToday ? t.text.accent : t.border.default}`,
                background: isToday ? t.fill.accentSubtle : t.fill.secondary,
                color: muted ? t.text.tertiary : t.text.secondary,
              }}
            >
              <span style={{ color: isToday ? t.text.accent : t.text.tertiary, fontWeight: t.weight.semibold }}>{name}{isToday ? " · Today" : ""}</span>
              <span style={{ color: isToday ? t.text.primary : muted ? t.text.tertiary : t.text.secondary, fontWeight: isToday ? t.weight.medium : t.weight.regular }}>{dayText(d)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...small, marginTop: 4, color: t.text.tertiary }}>{b.hoursSource}</div>
    </div>
  );

  const todayLine = (b: Biz) => {
    const st = openState(b, now);
    const dayName = DAYS.find(([k]: [DayKey, string]) => k === now.day)?.[1] ?? "";
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ ...small, color: t.text.primary }}>
          Right now ({dayName}, {dayText(b.hours[now.day])})
        </span>
        <Status tone={st === "open" ? "success" : st === "closed" ? "warning" : "neutral"}>
          {st === "open" ? "Open" : st === "closed" ? "Closed" : "Hours not confirmed"}
        </Status>
      </div>
    );
  };

  const tools = (b: Biz) => {
    const list = peers(b);
    const i = list.findIndex((x: Biz) => x.id === b.id);
    const isSaved = placements[b.id] === "saved";
    if (pending === b.id) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
          <span style={{ ...small, color: t.text.primary }}>Remove from this list? The site, deployment and repo are untouched.</span>
          <Button label="Remove" variant="primary" onClick={() => remove(b.id)} />
          <Button label="Cancel" onClick={() => setPending("")} />
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
        {!isSaved && view !== "saved" && (
          <>
            <Button label="↑ Up" disabled={i <= 0} onClick={() => move(b, -1)} />
            <Button label="↓ Down" disabled={i < 0 || i >= list.length - 1} onClick={() => move(b, 1)} />
          </>
        )}
        <select
          aria-label={`Move ${b.name}`}
          value=""
          onChange={(event) => {
            if (event.target.value) moveTo(b.id, event.target.value as View);
          }}
          style={{
            ...small,
            maxWidth: "100%",
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${t.border.default}`,
            color: t.text.primary,
            background: t.paper,
            cursor: "pointer",
          }}
        >
          <option value="" disabled>Move to…</option>
          {(isSaved
            ? [{ value: "all", label: "All" }, { value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }]
            : [{ value: "saved", label: "Saved for later" }, { value: "all", label: "All" }, { value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }]
          ).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Button label="Remove" onClick={() => setPending(b.id)} />
      </div>
    );
  };

  const card = (b: Biz, displayIndex?: number) => (
    <div
      key={b.id}
      style={{
        padding: "16px",
        marginBottom: 12,
        border: `1px solid ${t.border.default}`,
        borderLeft: `4px solid ${t.text.accent}`,
        borderRadius: 12,
        background: t.paper,
        boxShadow: `0 1px 2px ${t.text.primary}0d`,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div
            style={{
              fontSize: t.font.heading3.fontSize,
              lineHeight: t.font.heading3.lineHeight,
              fontWeight: t.weight.semibold,
              color: t.text.primary,
            }}
          >
            {(view === "morning" || view === "afternoon")
              ? `${(displayIndex ?? 0) + 1}. ${b.name}`
              : b.route
                ? `${displayIndex ?? b.walkOrder}. ${b.name}`
                : b.name}
          </div>
          <div style={{ ...small, marginTop: 4, color: t.text.primary }}>
            {b.route ? `${DAYS.find(([k]) => k === selectedDay)?.[1] ?? "Thu"} ${formatMinutes(arrivalAt(b, startTime))} · ${b.address}, ${b.town}` : `${b.address}, ${b.town}`}
          </div>
          <div style={{ ...small, marginTop: 4 }}>
            {b.owner ? (
              <>
                <span style={{ color: t.text.tertiary, fontWeight: t.weight.medium }}>Owner: </span>
                {/unknown|not confirmed/i.test(b.owner) ? (
                  <span>{b.owner}</span>
                ) : (
                  <>
                    <span style={{ color: t.text.warning, fontWeight: t.weight.semibold }}>
                      {b.owner.split(" (")[0]}
                    </span>
                    {b.owner.includes(" (") && (
                      <span style={{ color: t.text.secondary }}>
                        {" (" + b.owner.split(" (").slice(1).join(" (")}
                      </span>
                    )}
                  </>
                )}
              </>
            ) : ""}
          </div>
          <div style={{ ...small, marginTop: 4 }}>
            Open {DAY_NAMES[selectedDay]} {dayText(b.hours[selectedDay])} · Best window {b.window}
          </div>
          <div style={{ ...small, marginTop: 4, color: flagColor(b.route ? routeMessageTone(b) : b.flagTone), fontWeight: t.weight.medium }}>
            {b.route ? routeMessage(b) : b.flag}
          </div>
          {todayLine(b)}
          {weekGrid(b)}
          {b.notes && <div style={{ ...small, marginTop: 8, color: t.text.tertiary }}>{b.notes}</div>}
          {tools(b)}
        </div>

        <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={label}>Your demo</div>
            {b.demoUrl ? (
              <a href={b.demoUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkBtn(true), marginTop: 4 }}>
                {host(b.demoUrl)} ↗
              </a>
            ) : (
              <div style={{ ...small, marginTop: 4, color: t.text.warning }}>No demo yet</div>
            )}
          </div>
          <div>
            <div style={label}>
              Current site ·{" "}
              <span style={{ color: statusColor(b.oldStatus), fontWeight: t.weight.medium }}>
                {b.oldStatus === "None" ? "none found" : b.oldStatus === "Unknown" ? "not confirmed" : b.oldStatus.toLowerCase()}
              </span>
            </div>
            {b.oldUrl && (
              <a href={b.oldUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkBtn(false), marginTop: 4 }}>
                {host(b.oldUrl)} ↗
              </a>
            )}
            {b.oldNote && <div style={{ ...small, marginTop: 4, color: t.text.tertiary }}>{b.oldNote}</div>}
          </div>
        </div>

        <div style={{ flex: "0 1 180px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={label}>Stage</div>
            <div style={{ ...small, color: t.text.primary }}>{b.stage}</div>
          </div>
          {b.updatedLabel && (
            <div>
              <div style={label}>Demo last deployed</div>
              <div style={{ ...small, color: t.text.primary }}>{b.updatedLabel}</div>
            </div>
          )}
          {b.repo && (
            <div>
              <div style={label}>GitHub</div>
              {a(b.repoUrl ?? `https://github.com/madisondesignprojects-ship-it/${b.repo}`, b.repo)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const listBox = (items: Biz[]) => {
    let routeNumber = 0;
    return (
      <div style={{ marginTop: 16, borderTop: `1px solid ${t.border.default}` }}>
        {items.map((b: Biz) => {
          const number = b.route ? ++routeNumber : undefined;
          return card(b, number);
        })}
      </div>
    );
  };

  return (
    <Page
      title={`${DAY_NAMES[selectedDay]} walk route: ${formatMinutes(startTime)}–${formatMinutes(startTime + ROUTE_DURATION_MINUTES)}`}
      summary="Choose a walk day and start time below. Your selected day and time are remembered in this browser. Each visit is planned as a 10-minute meeting, with opening-hour checks for the selected day."
      width="wide"
    >
      <Section heading="Route and timing">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, ...small }}>
            <span style={{ color: t.text.tertiary, fontSize: t.font.label.fontSize }}>Walk day</span>
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value as DayKey)}
              style={{ ...small, minWidth: 150, padding: "8px 10px", borderRadius: 8, border: `1px solid ${t.border.default}`, color: t.text.primary, background: t.paper }}
            >
              {DAYS.map(([key]) => <option key={key} value={key}>{DAY_NAMES[key]}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, ...small }}>
            <span style={{ color: t.text.tertiary, fontSize: t.font.label.fontSize }}>Start time</span>
            <select
              value={startTime}
              onChange={(event) => setStartTime(Number(event.target.value))}
              style={{ ...small, minWidth: 130, padding: "8px 10px", borderRadius: 8, border: `1px solid ${t.border.default}`, color: t.text.primary, background: t.paper }}
            >
              {START_TIMES.map((mins) => <option key={mins} value={mins}>{formatMinutes(mins)}</option>)}
            </select>
          </label>
        </div>
        <Table
          columns={["Stop", "Arrive", "Meeting", "Address", `Open ${DAYS.find(([k]) => k === selectedDay)?.[1] ?? "Thu"}`, "Best window", "Timing"]}
          align={["start", "start", "start", "start", "start", "start", "start"]}
          rows={[
            ...routeStops.map((b: Biz, index: number) => [
              `${index + 1}. ${b.name}`,
              formatMinutes(arrivalAt(b, startTime)),
              `${MEETING_DURATION_MINUTES} min`,
              b.address,
              dayText(b.hours[selectedDay]),
              b.window,
              { text: routeMessage(b), tone: routeMessageTone(b) },
            ]),
            ["Done, leave", formatMinutes(startTime + ROUTE_DURATION_MINUTES), "", "", "", "", ""],
          ]}
        />
        <Callout tone="info" lead={`${routeStops.filter((b: Biz) => arrivalStatus(b, arrivalAt(b, startTime)) === "open").length} of ${routeStops.length} route stops are open at their planned arrival times.`}>
          Opening checks use the listed hours for {DAY_NAMES[selectedDay]}. Verify any unconfirmed hours before starting the walk.
        </Callout>
        <Text>Plan 10 minutes per meeting. The downtown arrival slots are 12 minutes apart, leaving about 2 minutes to walk between nearby stops. The Pub has a 30-minute gap before the downtown route to allow for the 10–12 minute drive back and a little buffer. Start times are estimates, so wrap up on time if the next owner is waiting.</Text>
      </Section>

      <Section heading="Stops">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <span style={label}>Show</span>
          <Segmented<View>
            value={view}
            onChange={(v: View) => {
              setView(v);
              setPending("");
            }}
            options={[
              { value: "all", label: "All", count: countFor("all") },
              { value: "morning", label: "Morning", count: countFor("morning") },
              { value: "afternoon", label: "Afternoon", count: countFor("afternoon") },
              { value: "saved", label: "Saved for later", count: countFor("saved") },
            ]}
          />
          {removed.length > 0 && <Button label={`Restore removed (${removed.length})`} onClick={() => setRemoved([])} />}
          {reordered && <Button label="Reset order" onClick={resetOrder} />}
        </div>
        <Text>
          Morning means posted hours overlap 6 AM–noon; afternoon means noon–6 AM, so late-night spots count. Afternoon starts sorted by earliest opening time for the selected day. Use Up and Down to set a manual order independently for Morning or Afternoon; those choices and saved-for-later placements persist in this browser.
        </Text>
        {view === "saved" ? (
          visible.length > 0 ? (
            <Section heading="Saved for later">{listBox(visible)}</Section>
          ) : (
            <Callout tone="info" lead="Nothing saved for later yet.">
              Use the “Move to…” menu on any business card to keep it here for another day.
            </Callout>
          )
        ) : (
          visible.length > 0 && listBox(visible)
        )}
      </Section>

      <Section heading="Completed sites">
        <Table
          columns={["Business", "Town", "Your demo", "Current site", "Deployed", "GitHub", "Notes"]}
          align={["start", "start", "start", "start", "start", "start", "start"]}
          rows={SITES.map((x: Site) => [
            x.name,
            x.town,
            a(x.demoUrl, `${host(x.demoUrl)} ↗`),
            x.oldUrl
              ? { text: `${host(x.oldUrl)} · ${x.oldStatus === "Live" ? "live" : "down"}`, tone: (x.oldStatus === "Live" ? "success" : "danger") as FlagTone }
              : "Not confirmed",
            x.deployed,
            x.repo ? a(`https://github.com/madisondesignprojects-ship-it/${x.repo}`, x.repo) : "",
            x.notes,
          ])}
        />
        <Text>Finished builds on Vercel that aren't walk stops yet. Current sites were checked Oct 26, 2026; hours and contacts aren't sourced yet.</Text>
      </Section>
    </Page>
  );
}
