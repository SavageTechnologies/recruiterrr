'use client'

import { useState, useEffect, useRef } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

// ─── ALL 181 INTEGRITY PARTNERS ───────────────────────────────────────────
// Source: integrity.com/partner/ — admin-managed, no user additions
const PARTNERS = [
  { id: 1,   name: "Premier Marketing",                  city: "Norfolk",            state: "NE", coords: [-97.4, 42.0],  website: "premiersmi.com" },
  { id: 2,   name: "American Benefit LLC",               city: "La Crosse",          state: "WI", coords: [-91.25, 43.8], website: "americanbenefitllc.com" },
  { id: 3,   name: "AIMC",                               city: "Woodstock",          state: "GA", coords: [-84.5, 34.1],  website: "aimc.net" },
  { id: 4,   name: "Neishloss & Fleming",                city: "Canonsburg",         state: "PA", coords: [-80.2, 40.3],  website: "neishloss.com" },
  { id: 5,   name: "Insurance Marketing Group",          city: "Clinton",            state: "CT", coords: [-72.5, 41.3],  website: "img-sis.com" },
  { id: 6,   name: "American Independent Marketing",     city: "Yakima",             state: "WA", coords: [-120.5, 46.6], website: "whyaim.com" },
  { id: 7,   name: "Western Penn Marketing",             city: "Mesa",               state: "AZ", coords: [-111.8, 33.4], website: "westernpenn.com" },
  { id: 8,   name: "GoldenCare USA",                     city: "Plymouth",           state: "MN", coords: [-93.45, 45.0], website: "goldencareagent.com" },
  { id: 9,   name: "Cornerstone Senior Marketing",       city: "Powell",             state: "OH", coords: [-83.07, 40.15],website: "cornerstoneseniormarketing.com" },
  { id: 10,  name: "Agent Service Connection",           city: "Sarasota",           state: "FL", coords: [-82.5, 27.3],  website: "ascfinalexpense.com" },
  { id: 11,  name: "Scott Riddle Agency",                city: "Waco",               state: "TX", coords: [-97.15, 31.55],website: "scottriddleagency.com" },
  { id: 12,  name: "EIS Eldercare Insurance Services",   city: "Hot Springs",        state: "AR", coords: [-93.05, 34.5], website: "eldercarebroker.com" },
  { id: 13,  name: "Tidewater Management",               city: "Raleigh",            state: "NC", coords: [-78.64, 35.78],website: "tidewatermg.com" },
  { id: 14,  name: "NEAT Management Group",              city: "Austin",             state: "TX", coords: [-97.73, 30.26],website: "neatmgmt.com" },
  { id: 15,  name: "Senior Select",                      city: "LaGrange",           state: "GA", coords: [-85.03, 33.04],website: "seniorselectins.com" },
  { id: 16,  name: "MultiState Insurance",               city: "Grand Haven",        state: "MI", coords: [-86.22, 43.06],website: "multistateinsurance.com" },
  { id: 17,  name: "Savers Marketing",                   city: "Winston-Salem",      state: "NC", coords: [-80.24, 36.1], website: "saversmarketing.com" },
  { id: 18,  name: "Emrick Group",                       city: "Griggsville",        state: "IL", coords: [-90.72, 39.7], website: "emrickgroup.com" },
  { id: 19,  name: "American Senior Benefits",           city: "Olathe",             state: "KS", coords: [-94.82, 38.88],website: "americanseniorbenefits.com" },
  { id: 20,  name: "Senior Insurance Brokers",           city: "Fort Worth",         state: "TX", coords: [-97.33, 32.75],website: "seniorinsbrokers.com" },
  { id: 21,  name: "Pinnacle Benefits Group",            city: "Winston-Salem",      state: "NC", coords: [-80.3, 36.2],  website: "pinnaclebenefits.com" },
  { id: 22,  name: "Drennan Insurance Marketing",        city: "Little Rock",        state: "AR", coords: [-92.29, 34.75],website: "drennancompanies.com" },
  { id: 23,  name: "MAS Insurance Marketing",            city: "Hoover",             state: "AL", coords: [-86.8, 33.4],  website: "masinsurancemarketing.com" },
  { id: 24,  name: "Family First Life",                  city: "Uncasville",         state: "CT", coords: [-72.1, 41.45], website: "familyfirstlife.com" },
  { id: 25,  name: "Your Insurance Group",               city: "Melbourne",          state: "FL", coords: [-80.6, 28.08], website: "yourinsurancegroup.net" },
  { id: 26,  name: "Great American Legacy",              city: "Cedar Rapids",       state: "IA", coords: [-91.67, 42.0], website: "americanseniorbenefits.com" },
  { id: 27,  name: "North American Senior Benefits",     city: "Lawrenceville",      state: "GA", coords: [-83.99, 33.96],website: "nasbinc.com" },
  { id: 28,  name: "Senior Solutions",                   city: "Omaha",              state: "NE", coords: [-95.93, 41.26],website: "americanseniorbenefits.com" },
  { id: 29,  name: "Agent Pipeline",                     city: "St. Albans",         state: "WV", coords: [-81.85, 38.38],website: "agentpipeline.com" },
  { id: 30,  name: "ThomasArts",                         city: "Farmington",         state: "UT", coords: [-111.9, 40.98],website: "thomasarts.com" },
  { id: 31,  name: "Palmetto Senior Benefits",           city: "Greer",              state: "SC", coords: [-82.15, 34.93],website: "palmettosb.com" },
  { id: 32,  name: "Family First Life USA",              city: "Las Vegas",          state: "NV", coords: [-115.14, 36.17],website: "familyfirstlifeusa.com" },
  { id: 33,  name: "LifeSmart Senior Services",          city: "Elgin",              state: "IL", coords: [-88.28, 42.03], website: "lifesmartseniorservices.com" },
  { id: 34,  name: "Family First Life Southeast",        city: "Kennesaw",           state: "GA", coords: [-84.61, 34.02], website: "familyfirstlifesoutheast.com" },
  { id: 35,  name: "The Brokerage Resource",             city: "Apex",               state: "NC", coords: [-78.85, 35.73], website: "tbrins.com" },
  { id: 36,  name: "Equis Financial",                    city: "Asheville",          state: "NC", coords: [-82.55, 35.57], website: "equisfinancial.com" },
  { id: 37,  name: "Senior Benefit Services",            city: "Columbia",           state: "MO", coords: [-92.33, 38.95], website: "sbsteam.net" },
  { id: 38,  name: "Senior Marketing Specialists",       city: "Columbia",           state: "MO", coords: [-92.28, 38.9],  website: "smsteam.net" },
  { id: 39,  name: "The Alliance",                       city: "Burlington",         state: "NC", coords: [-79.44, 36.1],  website: "naaleads.com" },
  { id: 40,  name: "McClain Insurance",                  city: "Hesperia",           state: "CA", coords: [-117.3, 34.43], website: "fflwestcoast.com" },
  { id: 41,  name: "New Horizons Insurance Marketing",   city: "Decatur",            state: "IL", coords: [-88.95, 39.84], website: "newhorizonsmktg.com" },
  { id: 42,  name: "Heartland Retirement Group",         city: "Johnston",           state: "IA", coords: [-93.72, 41.68], website: "yourhrg.com" },
  { id: 43,  name: "ASB Financial",                      city: "Tampa",              state: "FL", coords: [-82.46, 27.95], website: "asbfinancial.com" },
  { id: 44,  name: "Southern Insurance Group",           city: "Lawrenceburg",       state: "TN", coords: [-87.33, 35.25], website: "southerninsurance.net" },
  { id: 45,  name: "The Assurance Group",                city: "Archdale",           state: "NC", coords: [-79.96, 35.9],  website: "assuregrp.com" },
  { id: 46,  name: "Insurance Administrative Solutions", city: "Clearwater",         state: "FL", coords: [-82.8, 27.97],  website: "iasadmin.com" },
  { id: 47,  name: "The Health Insurance Place",         city: "Johnstown",          state: "PA", coords: [-78.92, 40.33], website: "thehealthinsuranceplace.com" },
  { id: 48,  name: "Western Asset Protection",           city: "Phoenix",            state: "AZ", coords: [-112.07, 33.45],website: "westernassetprotection.com" },
  { id: 49,  name: "Smith Agency",                       city: "Vancouver",          state: "WA", coords: [-122.66, 45.63],website: "fflinw.com" },
  { id: 50,  name: "American Group",                     city: "Dallas",             state: "TX", coords: [-96.8, 32.78],  website: "americangroupinsurance.com" },
  { id: 51,  name: "Best Value Insurance Services",      city: "Ferndale",           state: "WA", coords: [-122.6, 48.85], website: "bestvaluesins.com" },
  { id: 52,  name: "IFC National Marketing",             city: "Coon Rapids",        state: "MN", coords: [-93.31, 45.12], website: "ifcnationalmarketing.com" },
  { id: 53,  name: "Connexion Point",                    city: "Sandy",              state: "UT", coords: [-111.86, 40.57],website: "connexionpoint.com" },
  { id: 54,  name: "CSG Actuarial",                      city: "Omaha",              state: "NE", coords: [-96.0, 41.3],   website: "csgactuarial.com" },
  { id: 55,  name: "Priority Life",                      city: "Boca Raton",         state: "FL", coords: [-80.1, 26.35],  website: "prioritylifegroup.com" },
  { id: 56,  name: "Advisors Insurance Brokers",         city: "Clifton Park",       state: "NY", coords: [-73.84, 42.86], website: "advisorsib.com" },
  { id: 57,  name: "J. Berg & Associates",               city: "St. Louis",          state: "MO", coords: [-90.19, 38.63], website: "jbergassociates.com" },
  { id: 58,  name: "Copeland Insurance Group",           city: "Longview",           state: "TX", coords: [-94.74, 32.5],  website: "copelandgroupusa.com" },
  { id: 59,  name: "MERIT Insurance Services",           city: "West Hartford",      state: "CT", coords: [-72.74, 41.76], website: "meritins.com" },
  { id: 60,  name: "Access Capital Group",               city: "Omaha",              state: "NE", coords: [-95.9, 41.2],   website: "accesscapitalgrp.com" },
  { id: 61,  name: "Brokers International",              city: "Urbandale",          state: "IA", coords: [-93.71, 41.63], website: "biltd.com" },
  { id: 62,  name: "Modern Insurance Marketing",         city: "Wilsonville",        state: "OR", coords: [-122.77, 45.3], website: "moderninsurance.com" },
  { id: 63,  name: "Kellogg Insurance Partners",         city: "Draper",             state: "UT", coords: [-111.86, 40.52],website: "kelloggins.com" },
  { id: 64,  name: "Polcyn Insurance",                   city: "Mesa",               state: "AZ", coords: [-111.7, 33.42], website: "polcynfinancial.com" },
  { id: 65,  name: "Deft Research",                      city: "Minneapolis",        state: "MN", coords: [-93.27, 44.98], website: "deftresearch.com" },
  { id: 66,  name: "Plan Advisors",                      city: "Doral",              state: "FL", coords: [-80.35, 25.82], website: "myplanadvisors.com" },
  { id: 67,  name: "Anthony Insurance Agency",           city: "Boca Raton",         state: "FL", coords: [-80.12, 26.38], website: "familyfirstlife.com" },
  { id: 68,  name: "PSI Groups",                         city: "Celebration",        state: "FL", coords: [-81.55, 28.32], website: "psigroups.net" },
  { id: 69,  name: "Unified Health",                     city: "Sunrise",            state: "FL", coords: [-80.26, 26.17], website: "unifiedhealth.com" },
  { id: 70,  name: "ASPECT Management",                  city: "Columbia",           state: "SC", coords: [-81.03, 34.0],  website: "aspect-mgmt.com" },
  { id: 71,  name: "Advanced Planning Services",         city: "Brown Deer",         state: "WI", coords: [-87.97, 43.17], website: "advanceps.com" },
  { id: 72,  name: "Agent Force",                        city: "Kennesaw",           state: "GA", coords: [-84.59, 34.04], website: "fflagentforce.com" },
  { id: 73,  name: "Family First Life AMS",              city: "Coeur d'Alene",      state: "ID", coords: [-116.78, 47.68],website: "fflams.com" },
  { id: 74,  name: "Health Insurance Store",             city: "Kissimmee",          state: "FL", coords: [-81.41, 28.29], website: "4insurancestore.com" },
  { id: 75,  name: "The Cornerstone Group",              city: "Wake Forest",        state: "NC", coords: [-78.51, 35.97], website: "thecornerstonegroup.life" },
  { id: 76,  name: "Theodore Group",                     city: "Cape Coral",         state: "FL", coords: [-81.99, 26.65], website: "theodoregroup.info" },
  { id: 77,  name: "Montalto United Insurance Agency",   city: "Fort Walton Beach",  state: "FL", coords: [-86.62, 30.41], website: "fflunited.com" },
  { id: 78,  name: "Carolina Senior Marketing",          city: "Cary",               state: "NC", coords: [-78.78, 35.79], website: "carolinaseniormarketing.com" },
  { id: 79,  name: "The Leazer Group",                   city: "Raleigh",            state: "NC", coords: [-78.7, 35.82],  website: "leazergroup.com" },
  { id: 80,  name: "Michael O'Brien Insurance",          city: "Mayfield",           state: "NY", coords: [-74.26, 43.1],  website: "ob1insurance.com" },
  { id: 81,  name: "Senior Security Benefits",           city: "Fort Worth",         state: "TX", coords: [-97.37, 32.72], website: "seniorsecuritybenefits.com" },
  { id: 82,  name: "Universe Financial Insurance Svc",   city: "Naperville",         state: "IL", coords: [-88.15, 41.77], website: "ffluniverse.com" },
  { id: 83,  name: "GarityAdvantage",                    city: "Norwell",            state: "MA", coords: [-70.8, 42.16],  website: "garityadvantage.com" },
  { id: 84,  name: "Star Benefit Associates",            city: "Indianapolis",       state: "IN", coords: [-86.15, 39.77], website: "starbenefitassociates.com" },
  { id: 85,  name: "Berwick Insurance Group",            city: "Tucson",             state: "AZ", coords: [-110.93, 32.22],website: "berwickinsurance.com" },
  { id: 86,  name: "One Resource Group",                 city: "Roanoke",            state: "IN", coords: [-85.37, 40.96], website: "oneresourcegroup.com" },
  { id: 87,  name: "Twardowski Insurance Agency",        city: "Denver",             state: "CO", coords: [-104.99, 39.74],website: "fflmilehigh.com" },
  { id: 88,  name: "Oberlin Marketing",                  city: "Fort Wayne",         state: "IN", coords: [-85.14, 41.08], website: "oberlinmarketing.com" },
  { id: 89,  name: "Aegis Financial",                    city: "Denver",             state: "CO", coords: [-104.95, 39.7], website: "aegisfinancial.com" },
  { id: 90,  name: "Fidelis Consultants",                city: "Gilbert",            state: "AZ", coords: [-111.79, 33.35],website: "fidelisins.com" },
  { id: 91,  name: "WealthFirm",                         city: "Norfolk",            state: "NE", coords: [-97.42, 42.03], website: "wealthfirm.info" },
  { id: 92,  name: "Brokerage 1 Agency",                 city: "Brunswick",          state: "OH", coords: [-81.84, 41.24], website: "brokerage1agency.com" },
  { id: 93,  name: "D&D Insurance",                      city: "Ferndale",           state: "WA", coords: [-122.59, 48.84],website: "danddinsurance.com" },
  { id: 94,  name: "Shields Brokerage",                  city: "Exeter",             state: "NH", coords: [-70.95, 42.98], website: "shieldsbrokerage.com" },
  { id: 95,  name: "Modern District Financial",          city: "Traverse City",      state: "MI", coords: [-85.62, 44.76], website: "moderndistrict.com" },
  { id: 96,  name: "Community Connections",              city: "Manchester",         state: "KY", coords: [-83.76, 37.15], website: "communityconnections.live" },
  { id: 97,  name: "Golden Years Design Benefits",       city: "Freehold",           state: "NJ", coords: [-74.28, 40.26], website: "yourmedicaremarketplace.net" },
  { id: 98,  name: "DuBose Senior Insurance Marketing",  city: "Florence",           state: "SC", coords: [-79.78, 34.2],  website: "duboseseniorinsurance.com" },
  { id: 99,  name: "The Fitz Group",                     city: "Addison",            state: "TX", coords: [-96.83, 32.96], website: "thefitzgroup.org" },
  { id: 100, name: "Stateline Senior Services",          city: "Somers",             state: "CT", coords: [-72.43, 41.99], website: "statelineseniorservices.com" },
  { id: 101, name: "Golden State Insurance Agency",      city: "Carlsbad",           state: "CA", coords: [-117.35, 33.16],website: "fflgoldenstate.com" },
  { id: 102, name: "Brokers Clearing House",             city: "Des Moines",         state: "IA", coords: [-93.62, 41.6],  website: "bchlife.com" },
  { id: 103, name: "PIPAC Health & Life Insurance",      city: "Cedar Falls",        state: "IA", coords: [-92.45, 42.53], website: "pipac.com" },
  { id: 104, name: "Northwest Farmer-Stockman",          city: "Spokane",            state: "WA", coords: [-117.43, 47.66],website: "northwestfarmerstockman.com" },
  { id: 105, name: "The Diversified Companies",          city: "Parsippany",         state: "NJ", coords: [-74.42, 40.86], website: "thediv.com" },
  { id: 106, name: "Schmidt Insurance Services",         city: "Ellington",          state: "CT", coords: [-72.47, 41.9],  website: "fflnortheast.com" },
  { id: 107, name: "Maryland Life Insurance Services",   city: "Bel Air",            state: "MD", coords: [-76.35, 39.54], website: "fflnational.com" },
  { id: 108, name: "AIP Marketing Alliance",             city: "Troy",               state: "MI", coords: [-83.15, 42.6],  website: "aipma.com" },
  { id: 109, name: "Lion Street",                        city: "Austin",             state: "TX", coords: [-97.75, 30.3],  website: "lionstreet.com" },
  { id: 110, name: "Senior Insurance Marketing",         city: "Lincoln",            state: "NE", coords: [-96.67, 40.81], website: "simkt.com" },
  { id: 111, name: "Osborn Insurance Group",             city: "Springfield",        state: "MO", coords: [-93.29, 37.22], website: "osborn-ins.com" },
  { id: 112, name: "Global Premier Benefits",            city: "Owings Mills",       state: "MD", coords: [-76.78, 39.41], website: "globalpremierbenefits.com" },
  { id: 113, name: "Senior Advisory Insurance Services", city: "Cicero",             state: "NY", coords: [-76.07, 43.18], website: "senioradvisoryinsurance.com" },
  { id: 114, name: "Trusted Senior Specialists",         city: "Houston",            state: "TX", coords: [-95.37, 29.76], website: "trustedseniorspecialists.com" },
  { id: 115, name: "J. Gavin Financial Services",        city: "Kennewick",          state: "WA", coords: [-119.14, 46.21],website: "jgavinfs.com" },
  { id: 116, name: "J. Helbig & Company",                city: "St. Louis",          state: "MO", coords: [-90.12, 38.7],  website: "jhelbig.com" },
  { id: 117, name: "The Foschini Group",                 city: "Farmington",         state: "CT", coords: [-72.83, 41.72], website: "foschinigroup.com" },
  { id: 118, name: "Resource Brokerage",                 city: "Schaumburg",         state: "IL", coords: [-88.08, 42.03], website: "resourcebrokerage.com" },
  { id: 119, name: "Carothers Insurance Agency",         city: "Las Vegas",          state: "NV", coords: [-115.2, 36.1],  website: "carothersinsurance.com" },
  { id: 120, name: "Penn Global Marketing",              city: "St. Louis",          state: "MO", coords: [-90.25, 38.6],  website: "pennglobalmarketing.com" },
  { id: 121, name: "First American Insurance Underwrtrs",city: "Boston",             state: "MA", coords: [-71.06, 42.36], website: "faiu.com" },
  { id: 122, name: "J. Manning & Associates",            city: "Chicago",            state: "IL", coords: [-87.63, 41.88], website: "jmanningltc.com" },
  { id: 123, name: "Western Marketing",                  city: "Missouri Valley",    state: "IA", coords: [-95.89, 41.56], website: "wmacorp.com" },
  { id: 124, name: "J.D. Mullens",                       city: "Jacksonville",       state: "FL", coords: [-81.66, 30.33], website: "jdmullens.com" },
  { id: 125, name: "Yellowstone Life Insurance Agency",  city: "Weatherford",        state: "TX", coords: [-97.8, 32.76],  website: "yellowstonelifegroup.com" },
  { id: 126, name: "The Valdez Group",                   city: "Ontario",            state: "OH", coords: [-82.6, 40.76],  website: "thevaldezgroup.org" },
  { id: 127, name: "Greenhill Management",               city: "Ridgeland",          state: "MS", coords: [-90.11, 32.41], website: "greenhillmgmt.com" },
  { id: 128, name: "Senior Insurance Specialists",       city: "Joplin",             state: "MO", coords: [-94.51, 37.08], website: "seniorinsurancespecialists.com" },
  { id: 129, name: "Applied General Agency",             city: "Anaheim",            state: "CA", coords: [-117.91, 33.84],website: "appliedga.com" },
  { id: 130, name: "Honeycutt Insurance Marketing",      city: "Victorville",        state: "CA", coords: [-117.29, 34.54],website: "teamffl.com" },
  { id: 131, name: "Mail Pro Leads",                     city: "Las Vegas",          state: "NV", coords: [-115.13, 36.2], website: "mailproleads.com" },
  { id: 132, name: "Limitless Insurance Services",       city: "Scottsdale",         state: "AZ", coords: [-111.92, 33.5], website: "ffllimitless.com" },
  { id: 133, name: "Relentless Insurance Agency",        city: "Las Vegas",          state: "NV", coords: [-115.16, 36.15],website: "familyfirstliferelentless.com" },
  { id: 134, name: "Ash Brokerage",                      city: "Fort Wayne",         state: "IN", coords: [-85.12, 41.13], website: "ashbrokerage.com" },
  { id: 135, name: "Russek Financial Services",          city: "North Haven",        state: "CT", coords: [-72.86, 41.38], website: "russekfs.com" },
  { id: 136, name: "Ritter Insurance Marketing",         city: "Harrisburg",         state: "PA", coords: [-76.89, 40.27], website: "ritterim.com" },
  { id: 137, name: "HGI",                                city: "Alpharetta",         state: "GA", coords: [-84.3, 34.08],  website: "hgicrusade.com" },
  { id: 138, name: "Abernathy Financial Services",       city: "Fort Walton Beach",  state: "FL", coords: [-86.6, 30.44],  website: "abernathyfinancial.com" },
  { id: 139, name: "Hovis & Associates",                 city: "St. Louis",          state: "MO", coords: [-90.3, 38.57],  website: "hovisandassociates.com" },
  { id: 140, name: "SkyPoint Financial",                 city: "Las Vegas",          state: "NV", coords: [-115.1, 36.24], website: "fflskyp.com" },
  { id: 141, name: "Annuity Agents Alliance",            city: "Denver",             state: "CO", coords: [-104.93, 39.76],website: "annuityagentsalliance.com" },
  { id: 142, name: "Velocity Life Insurance Agency",     city: "Roanoke",            state: "VA", coords: [-79.94, 37.27], website: "fflvelocity.com" },
  { id: 143, name: "Statz Agency",                       city: "Phoenix",            state: "AZ", coords: [-112.0, 33.5],  website: "statzagency.com" },
  { id: 144, name: "Legacy Insurance and Financial",     city: "Salt Lake City",     state: "UT", coords: [-111.89, 40.76],website: "legacyifs.com" },
  { id: 145, name: "PHP Agency",                         city: "Addison",            state: "TX", coords: [-96.85, 32.95], website: "phpagency.com" },
  { id: 146, name: "Annexus",                            city: "Scottsdale",         state: "AZ", coords: [-111.95, 33.48],website: "annexus.com" },
  { id: 147, name: "Richman Insurance Agency",           city: "Dallas",             state: "TX", coords: [-96.77, 32.8],  website: "ffl-apex.com" },
  { id: 148, name: "American Business",                  city: "New York",           state: "NY", coords: [-74.01, 40.71], website: "americanbusiness.com" },
  { id: 149, name: "Senior Resource Services",           city: "Fayetteville",       state: "NC", coords: [-78.88, 35.05], website: "seniorresourceservices.com" },
  { id: 150, name: "Senior Planning Center",             city: "Farmington",         state: "ME", coords: [-70.15, 44.67], website: "seniorplanningcenter.com" },
  { id: 151, name: "Heartland Financial Group",          city: "Kansas City",        state: "MO", coords: [-94.58, 39.1],  website: "hfgagents.com" },
  { id: 152, name: "Compass Group Insurance",            city: "Fernandina Beach",   state: "FL", coords: [-81.46, 30.67], website: "compassgroupinsurance.com" },
  { id: 153, name: "Gott Professional Insurance Svc",    city: "Sacramento",         state: "CA", coords: [-121.49, 38.58],website: "gpis4u.org" },
  { id: 154, name: "Insurance Marketplace Agency",       city: "Portland",           state: "OR", coords: [-122.68, 45.52],website: "healthplansinoregon.com" },
  { id: 155, name: "Anderson-Kent Insurance Agency",     city: "Waco",               state: "TX", coords: [-97.16, 31.57], website: "andersonkent.com" },
  { id: 156, name: "Senior Services of North America",   city: "Melville",           state: "NY", coords: [-73.41, 40.79], website: "ssnaopportunity.com" },
  { id: 157, name: "Elevation Sales Coaching",           city: "Wake Forest",        state: "NC", coords: [-78.5, 35.98],  website: "elevation.market" },
  { id: 158, name: "Mason Insurance",                    city: "Colleyville",        state: "TX", coords: [-97.08, 32.89], website: "masoninsurance.net" },
  { id: 159, name: "Milner Financial",                   city: "Lawrenceville",      state: "GA", coords: [-84.0, 33.95],  website: "milnerfinancial.com" },
  { id: 160, name: "American Health Plans",              city: "Detroit",            state: "MI", coords: [-83.05, 42.33], website: "americanhealthplansinsurance.com" },
  { id: 161, name: "Gladstone Wealth Partners",          city: "Boca Raton",         state: "FL", coords: [-80.08, 26.33], website: "gladstonewealth.com" },
  { id: 162, name: "DeLong Sales Group",                 city: "LaGrange",           state: "GA", coords: [-85.02, 33.02], website: "delongsalesgroup.com" },
  { id: 163, name: "Senior Solutions & Services",        city: "Chesterfield",       state: "VA", coords: [-77.5, 37.38],  website: "seniorsolutionsservices.com" },
  { id: 164, name: "Easy Street Insurance",              city: "Indianapolis",       state: "IN", coords: [-86.17, 39.72], website: "easystreetins.com" },
  { id: 165, name: "MediSource",                         city: "Little Rock",        state: "AR", coords: [-92.35, 34.72], website: "medisourcear.com" },
  { id: 166, name: "Sellyei & Rundle",                   city: "Tucson",             state: "AZ", coords: [-110.97, 32.19],website: "sellyeiandrundle.com" },
  { id: 167, name: "Consolidated Marketing Group",       city: "Knoxville",          state: "TN", coords: [-83.92, 35.96], website: "cmgincorp.com" },
  { id: 168, name: "The Insurance Superstore",           city: "Colorado Springs",   state: "CO", coords: [-104.82, 38.83],website: "insurancess.org" },
  { id: 169, name: "Patriot Family Financial",           city: "Fredericksburg",     state: "VA", coords: [-77.46, 38.3],  website: "patriotfamilyfinancial.com" },
  { id: 170, name: "Christian Brindle Insurance",        city: "Sandy",              state: "UT", coords: [-111.87, 40.57],website: "christianbrindleinsuranceservices.com" },
  { id: 171, name: "Alliance Insurance Solutions",       city: "El Paso",            state: "TX", coords: [-106.49, 31.76],website: "ais-ep.com" },
  { id: 172, name: "The Porter Group",                   city: "Morehead",           state: "KY", coords: [-83.43, 38.19], website: "portergroupinsurance.com" },
  { id: 173, name: "Allen and Associates",               city: "Memphis",            state: "TN", coords: [-90.05, 35.15], website: "allenandassociates.agency" },
  { id: 174, name: "South Atlantic Management",          city: "Anderson",           state: "SC", coords: [-82.65, 34.5],  website: "southatlanticmgt.com" },
  { id: 175, name: "Senior Health & Life Benefits",      city: "Savannah",           state: "GA", coords: [-81.1, 32.08],  website: "seniorhealthlifebenefits.com" },
  { id: 176, name: "River City Senior Benefits",         city: "Chattanooga",        state: "TN", coords: [-85.31, 35.05], website: "seniorbenefitsolutionsinc.com" },
  { id: 177, name: "Stockton Agency",                    city: "Bentonville",        state: "AR", coords: [-94.21, 36.37], website: "stocktonagency.com" },
  { id: 178, name: "Ballard & Associates",               city: "Fulton",             state: "NY", coords: [-76.42, 43.32], website: "ballardassoc.com" },
  { id: 179, name: "Community Care Agency",              city: "Dallas",             state: "TX", coords: [-96.82, 32.85], website: "communitycare.com" },
  { id: 180, name: "INS Marketing Systems",              city: "DeSoto",             state: "TX", coords: [-96.86, 32.59], website: "insuranceconsumerbenefits.com" },
  { id: 181, name: "Invictus Marketing Solutions",       city: "Jefferson City",     state: "MO", coords: [-92.17, 38.57], website: "invictushealthandwealth.com" },
]

// Count by state for heat coloring
const STATE_COUNTS = PARTNERS.reduce((acc, p) => {
  acc[p.state] = (acc[p.state] || 0) + 1
  return acc
}, {})

const FIPS = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
  '13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH',
  '34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'
}

const C = {
  black: "#1a1814", dark: "#1f1d19", card: "#252320",
  border: "#2e2b27", borderLight: "#3a3732",
  orange: "#ff5500", orangeDim: "rgba(255,85,0,0.12)",
  white: "#f0ede8", muted: "#7a7570",
}

function getStateColor(abbr) {
  const n = STATE_COUNTS[abbr] || 0
  if (n === 0) return "#1e1b18"
  if (n >= 10) return "rgba(255,85,0,0.35)"
  if (n >= 6)  return "rgba(255,85,0,0.22)"
  if (n >= 3)  return "rgba(255,85,0,0.14)"
  return "rgba(255,85,0,0.08)"
}

export default function IntegrityPartnerMap() {
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState("")
  const [tooltip, setTooltip] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState([-96, 38])
  const listRef = useRef(null)

  const filtered = filter.trim()
    ? PARTNERS.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.city.toLowerCase().includes(filter.toLowerCase()) ||
        p.state.toLowerCase().includes(filter.toLowerCase())
      )
    : PARTNERS

  // Count by state for display
  const topStates = Object.entries(STATE_COUNTS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <div style={{ background: C.black, minHeight: "100vh", color: C.white, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${C.black}; }
        ::-webkit-scrollbar-thumb { background: ${C.borderLight}; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .partner-dot { cursor: pointer; transition: r 0.1s; }
        .partner-dot:hover { filter: brightness(1.4); }
        .card-in { animation: fadeIn 0.15s ease forwards; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.orange, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            ● LIVE NETWORK · ADMIN MANAGED
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, lineHeight: 1 }}>
            INTEGRITY<span style={{ color: C.orange }}>.</span> PARTNER NETWORK
          </h1>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { v: PARTNERS.length, l: "Total Partners" },
            { v: Object.keys(STATE_COUNTS).length, l: "States" },
            { v: topStates[0]?.[1] ?? 0, l: `Most in ${topStates[0]?.[0] ?? ""}` },
          ].map(s => (
            <div key={s.l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: C.orange, letterSpacing: 1 }}>{s.v}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAP + SIDEBAR ── */}
      <div style={{ display: "flex", height: "calc(100vh - 130px)" }}>

        {/* MAP */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup center={center} zoom={zoom} onMoveEnd={({ zoom: z, coordinates }) => { setZoom(z); setCenter(coordinates) }}>
              {/* States */}
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const fips = geo.id?.toString().padStart(2, "0")
                    const abbr = FIPS[fips] || ""
                    const n = STATE_COUNTS[abbr] || 0
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getStateColor(abbr)}
                        stroke={n > 0 ? "rgba(255,85,0,0.3)" : C.border}
                        strokeWidth={n > 0 ? 0.8 : 0.4}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: n > 0 ? "rgba(255,85,0,0.45)" : "#252320" },
                          pressed: { outline: "none" },
                        }}
                      >
                        <title>{abbr}{n > 0 ? ` — ${n} partner${n > 1 ? "s" : ""}` : ""}</title>
                      </Geography>
                    )
                  })
                }
              </Geographies>

              {/* Partner dots */}
              {PARTNERS.map(p => {
                const isActive = active?.id === p.id
                const isFiltered = filter.trim() && !filtered.find(f => f.id === p.id)
                if (isFiltered) return null
                return (
                  <Marker key={p.id} coordinates={p.coords}>
                    <circle
                      className="partner-dot"
                      r={isActive ? 6 / zoom : 4 / zoom}
                      fill={isActive ? C.orange : "rgba(255,85,0,0.75)"}
                      stroke={isActive ? C.white : "rgba(255,85,0,0.4)"}
                      strokeWidth={isActive ? 1.5 / zoom : 0.8 / zoom}
                      onClick={() => setActive(isActive ? null : p)}
                      onMouseEnter={() => setTooltip(p)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {isActive && (
                      <circle
                        r={12 / zoom}
                        fill="none"
                        stroke={C.orange}
                        strokeWidth={1 / zoom}
                        opacity={0.4}
                        style={{ pointerEvents: "none" }}
                      />
                    )}
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Integrity HQ marker overlay — Texas */}
          <div style={{
            position: "absolute", bottom: 20, left: 20,
            background: C.card, border: `1px solid ${C.border}`, padding: "12px 16px",
          }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { color: "rgba(255,85,0,0.08)", label: "1-2 Partners" },
                { color: "rgba(255,85,0,0.14)", label: "3-5" },
                { color: "rgba(255,85,0,0.22)", label: "6-9" },
                { color: "rgba(255,85,0,0.35)", label: "10+" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 10, background: l.color, border: `1px solid rgba(255,85,0,0.3)` }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{l.label}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.orange }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>Partner</span>
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && tooltip.id !== active?.id && (
            <div style={{
              position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
              background: C.card, border: `1px solid ${C.orange}`, padding: "8px 14px",
              fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.white, letterSpacing: 0.5,
              pointerEvents: "none", whiteSpace: "nowrap",
            }}>
              {tooltip.name} · {tooltip.city}, {tooltip.state}
            </div>
          )}

          {/* Zoom controls */}
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 2 }}>
            {[{ label: "+", delta: 0.5 }, { label: "−", delta: -0.5 }, { label: "⌂", reset: true }].map(btn => (
              <button
                key={btn.label}
                onClick={() => btn.reset ? (setZoom(1), setCenter([-96, 38])) : setZoom(z => Math.min(8, Math.max(1, z + btn.delta)))}
                style={{
                  width: 32, height: 32, background: C.card, border: `1px solid ${C.borderLight}`,
                  color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Detail card */}
          {active ? (
            <div className="card-in" style={{ padding: "20px", borderBottom: `1px solid ${C.border}`, background: C.dark }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.orange, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                PARTNER #{active.id}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, marginBottom: 10, lineHeight: 1.1 }}>
                {active.name}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                📍 {active.city}, {active.state}
              </div>
              <a
                href={`https://${active.website}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.orange, letterSpacing: 0.5, textDecoration: "underline", textDecorationColor: "rgba(255,85,0,0.3)" }}
              >
                {active.website}
              </a>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, padding: "8px 10px", fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                  {STATE_COUNTS[active.state]} partner{STATE_COUNTS[active.state] > 1 ? "s" : ""} in {active.state}
                </div>
              </div>
              <button
                onClick={() => setActive(null)}
                style={{ marginTop: 10, width: "100%", padding: "6px", background: "transparent", border: `1px solid ${C.borderLight}`, color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}
              >
                CLEAR
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Top States</div>
              {topStates.map(([st, n]) => (
                <div key={st} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.white }}>{st}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: n * 8, height: 4, background: C.orange, opacity: 0.7 }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.orange, minWidth: 16, textAlign: "right" }}>{n}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search partners..."
              style={{
                width: "100%", background: C.card, border: `1px solid ${C.borderLight}`, color: C.white,
                padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, outline: "none",
                letterSpacing: 0.5,
              }}
            />
            {filter && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 4, letterSpacing: 1 }}>
                {filtered.length} of {PARTNERS.length} partners
              </div>
            )}
          </div>

          {/* Partner list */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => setActive(active?.id === p.id ? null : p)}
                style={{
                  padding: "10px 16px",
                  borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer",
                  background: active?.id === p.id ? C.dark : "transparent",
                  borderLeft: active?.id === p.id ? `3px solid ${C.orange}` : "3px solid transparent",
                  transition: "all 0.1s",
                }}
                onMouseEnter={e => { if (active?.id !== p.id) e.currentTarget.style.background = C.card }}
                onMouseLeave={e => { if (active?.id !== p.id) e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: active?.id === p.id ? C.white : C.white, opacity: active?.id === p.id ? 1 : 0.85, lineHeight: 1.3, marginBottom: 2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>
                      {p.city}, {p.state}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: active?.id === p.id ? C.orange : C.borderLight, marginLeft: 8, flexShrink: 0 }}>
                    #{p.id}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, fontFamily: "'DM Mono', monospace", fontSize: 8, color: C.muted, letterSpacing: 1 }}>
            ADMIN-MANAGED · SOURCE: INTEGRITY.COM/PARTNER
          </div>
        </div>
      </div>
    </div>
  )
}
