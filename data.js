/*
 * data.js — every figure used on this site, with its source.
 * Update these numbers as new data is published; the UI reads only from here.
 */
window.DATA = {
  meta: {
    lastReviewed: "2026-09-03",
    note:
      "Figures are drawn from public sources (NHTSA, INRIX, Waymo, IIHS, academic " +
      "parking research). The 'preventable deaths' figure is a transparent scenario " +
      "model, not a measured fact — see the Method tab.",
  },

  /* ---- National road deaths (NHTSA / FARS). 2024–25 are NHTSA estimates. ---- */
  usTrafficDeaths: {
    source: "NHTSA Fatality Analysis Reporting System (FARS) final files; 2024 & 2025 are NHTSA early estimates.",
    sourceUrl: "https://www.nhtsa.gov/press-releases/nhtsa-estimates-39345-traffic-fatalities-2024",
    series: [
      { year: 2014, deaths: 32744 },
      { year: 2015, deaths: 35484 },
      { year: 2016, deaths: 37806 },
      { year: 2017, deaths: 37473 },
      { year: 2018, deaths: 36835 },
      { year: 2019, deaths: 36355 },
      { year: 2020, deaths: 38824 },
      { year: 2021, deaths: 42939 },
      { year: 2022, deaths: 42721 },
      { year: 2023, deaths: 40901 },
      { year: 2024, deaths: 39345, estimate: true },
      { year: 2025, deaths: 36640, estimate: true },
    ],
  },

  humanError: {
    value: 0.94,
    text:
      "In NHTSA's National Motor Vehicle Crash Causation Survey, the critical reason " +
      "for the crash was assigned to the driver in an estimated 94% of crashes. NHTSA " +
      "notes this is the last event in the chain, not necessarily the root cause.",
    source: "NHTSA, 'Critical Reasons for Crashes Investigated in the NMVCCS' (DOT HS 812 115, 2015).",
    sourceUrl: "https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/812115",
  },

  /* ---- Medical cost of crash injuries (NHTSA economic-impact study) ---- */
  crashMedicalCost: {
    year: 2019,
    annualUSD: 30_900_000_000,
    text:
      "NHTSA's economic-impact study put the present and future medical costs of motor " +
      "vehicle crash injuries in 2019 at $30.9 billion — 9.1% of the $339.8 billion total " +
      "economic cost of crashes that year.",
    source:
      "NHTSA, 'The Economic and Societal Impact of Motor Vehicle Crashes, 2019 (Revised)' (DOT HS 813 403, Feb 2023).",
    sourceUrl: "https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/813403",
  },

  /* ---- Waymo's published safety record ---- */
  waymo: {
    asOf: "March 2026",
    autonomousMiles: 170_000_000,
    milesPerWeek: 4_000_000,
    lifetimesEquivalent: 200, // "≈200 human lifetimes of driving"
    stats: [
      { label: "fewer crashes causing serious or fatal injury", value: 0.92 },
      { label: "fewer airbag-deployment crashes", value: 0.83 },
      { label: "fewer injury-causing crashes of any kind", value: 0.82 },
    ],
    seriousCrashPreventedEveryDays: 8,
    source: "Waymo Safety Impact Hub / 'Safety impact update: 170M miles' (Mar 19, 2026). Comparison is against human-driver crash rates in the same cities.",
    sourceUrl: "https://waymo.com/safety/impact/",
    thirdParty: {
      text:
        "An Insurance Institute for Highway Safety analysis of ~50M+ Waymo miles found " +
        "human drivers involved in about 4.06 crashes per million miles versus 1.28 for Waymo.",
      humanCrashesPerMillionMiles: 4.06,
      waymoCrashesPerMillionMiles: 1.28,
      source: "IIHS analysis, reported July 2026.",
      sourceUrl: "https://www.iihs.org/",
    },
    peerReviewed: {
      text:
        "A peer-reviewed comparison (Traffic Injury Prevention, 2025) of 56.7M rider-only " +
        "miles found statistically significant reductions versus human benchmarks, including " +
        "roughly 92% fewer crashes with pedestrian injuries and 85% fewer suspected-serious-injury crashes.",
      source: "Kusano et al., 'Comparison of Waymo Rider-Only crash rates by crash type to human benchmarks,' Traffic Injury Prevention (2025).",
      sourceUrl: "https://www.tandfonline.com/doi/full/10.1080/15389588.2025.2499887",
    },
  },

  /* ---- Time lost to congestion (INRIX 2025 Global Traffic Scorecard) ---- */
  congestion: {
    year: 2025,
    usHoursPerDriver: 49,
    usCostPerDriver: 894,
    usTotalCost: 85_000_000_000,
    source: "INRIX 2025 Global Traffic Scorecard (released Dec 2025).",
    sourceUrl: "https://inrix.com/press-releases/2025-global-traffic-scorecard-us/",
  },

  /* ---- Land given to parking (academic estimates; ranges are wide on purpose) ---- */
  parking: {
    spacesLow: 700_000_000,
    spacesHigh: 2_000_000_000,
    spacesPerVehicleLow: 2.5,
    spacesPerVehicleHigh: 7,
    sqFtPerSpace: 330, // a stall plus its share of drive aisles
    cityLandSharePct: 14, // some North American cities, incorporated land, parking only
    downtownLAPct: 24,
    cruisingForParkingPct: 30, // Shoup's often-cited share of downtown traffic hunting for a spot
    source:
      "D. Shoup, 'The High Cost of Free Parking' and later work; E. Scharnhorst / RMI, " +
      "'Quantified Parking' (2018); ASMR Education review of urban land use.",
    sourceUrl: "https://www.jalopnik.com/us-has-2-billion-parking-spaces-ruining-our-cities-1850294200/",
    // For scale comparisons:
    refAreas: [
      { name: "New Jersey", sqMi: 8723 },
      { name: "West Virginia", sqMi: 24230 },
      { name: "Manhattan", sqMi: 22.8 },
    ],
  },

  /* ---- City tabs ---- */
  cities: [
    {
      id: "nyc",
      name: "New York City",
      congestionHours: 102,
      congestionCostPerDriver: null,
      congestionCityCost: null,
      casualties: {
        deaths: {
          count: 253,
          year: 2024,
          source: "NYC DOT, year-end traffic-fatality release (Jan 2, 2026).",
          sourceUrl: "https://www.nyc.gov/html/dot/html/pr2026/traffic-deaths-reach-all-time-low.shtml",
        },
        injuries: {
          count: 3031,
          year: 2024,
          label: "people seriously injured",
          source: "NYC DOT, year-end traffic-fatality release (Jan 2, 2026).",
          sourceUrl: "https://www.nyc.gov/html/dot/html/pr2026/traffic-deaths-reach-all-time-low.shtml",
        },
      },
      status:
        "Testing only, with a trained safety driver required behind the wheel at all times. " +
        "The city opened its permit program in 2024, calling it the nation's toughest. Waymo " +
        "received the first permit in August 2025; it expired in March 2026 and renewal has " +
        "stalled at the city and state level. In April 2026 Governor Hochul pulled a limited " +
        "statewide autonomous-vehicle pilot from her budget, citing a lack of support in the Legislature.",
    statusSourceUrl: "https://www.nyc.gov/office-of-the-mayor/news/231-24/mayor-adams-releases-requirements-opens-permit-applications-responsible-autonomous-vehicle",
      quotes: [
        {
          text: "I really don't like it. I think it creates a danger.",
          who: "Bill de Blasio",
          role: "then-Mayor of New York City",
          when: "2017",
          context: "Responding to Governor Cuomo's push to test autonomous vehicles in New York.",
          url: "https://www.cbsnews.com/news/driverless-cars-new-york-city-andrew-cuomo/",
        },
        {
          text:
            "New Yorkers be warned, Waymo will turn pedestrians into cannon fodder and will " +
            "block streets for emergency responders.",
          who: "John Samuelsen",
          role: "International President, Transport Workers Union",
          when: "August 2025",
          context: "After the city announced Waymo's first testing permit.",
          url: "https://www.amny.com/nyc-transit/self-driving-cars-nyc-first-permit-waymo/",
        },
        {
          text:
            "The streets of New York City are not the place to experiment with dangerous, " +
            "untested, 5,000 lb driverless vehicles.",
          who: "Brendan Sexton",
          role: "President, Independent Drivers Guild",
          when: "August 2025",
          context: "Calling on the mayor to reverse the testing permit.",
          url: "https://www.amny.com/nyc-transit/self-driving-cars-nyc-first-permit-waymo/",
        },
        {
          text:
            "If a company like Waymo finds itself in New York City, what they will also find " +
            "is a city government that is committed to delivering for the workers who keep the " +
            "city running — and those workers also include our taxi drivers.",
          who: "Zohran Mamdani",
          role: "Mayor of New York City",
          when: "April 2026",
          context: "On the conditions the city would attach to any deployment.",
          url: "https://www.cityandstateny.com/policy/2026/04/across-ny-debate-about-inevitability-driverless-cars-begins/412618/",
        },
      ],
    },
    {
      id: "boston",
      name: "Boston",
      congestionHours: 83,
      congestionCostPerDriver: null,
      congestionCityCost: null,
      casualties: {
        deaths: {
          count: 16,
          year: 2024,
          source: "City of Boston, Vision Zero Fatality Records (Analyze Boston open data).",
          sourceUrl: "https://data.boston.gov/dataset/vision-zero-fatality-records",
        },
        injuries: {
          count: 68,
          year: 2023,
          label: "serious-injury crashes",
          source: "MassDOT IMPACT Crash Data Portal, City of Boston.",
          sourceUrl: "https://apps.crashdata.dot.mass.gov/cdp/home",
        },
      },
      status:
        "Testing only. Boston has run a deliberately small autonomous-vehicle program since 2016. " +
        "The Wu administration favors moving slowly; in July 2025 a majority of city councilors " +
        "raised concerns at a hearing and floated an ordinance requiring further study and a new " +
        "advisory commission before any cars without a driver. Waymo mapped Boston-area streets in " +
        "2025–26 but every vehicle was human-driven.",
      statusSourceUrl: "https://www.wgbh.org/news/local/2025-07-24/driverless-cars-run-into-resistance-at-boston-city-council",
      quotes: [
        {
          text:
            "Even if Waymos can operate safely in Boston, if every Waymo drives like a confused " +
            "out-of-state tourist, we will very quickly find them unwelcome on the streets of Boston.",
          who: "Jascha Franklin-Hodge",
          role: "Chief of Streets, City of Boston",
          when: "July 2025",
          context: "At a City Council hearing on autonomous vehicles.",
          url: "https://www.wgbh.org/news/local/2025-07-24/driverless-cars-run-into-resistance-at-boston-city-council",
        },
        {
          text: "This is too big, and too important, for us to be reactive.",
          who: "Jascha Franklin-Hodge",
          role: "Chief of Streets, City of Boston",
          when: "July 2025",
          context: "Explaining the administration's go-slow approach.",
          url: "https://www.wbur.org/news/2025/07/28/waymo-boston-city-council-self-driving-regulations-newsletter",
        },
        {
          text:
            "This will just tear into so many of our rideshare drivers' lives and their ability " +
            "to give to their families and raise their families here in the city.",
          who: "Erin Murphy",
          role: "Boston City Councilor, At-Large",
          when: "July 2025",
          context: "At the City Council hearing.",
          url: "https://www.wgbh.org/news/local/2025-07-24/driverless-cars-run-into-resistance-at-boston-city-council",
        },
        {
          text:
            "This whole idea that your technology is solving for something we already haven't " +
            "solved for — I feel like that's up to us as the city to figure out.",
          who: "Sharon Durkan",
          role: "Boston City Councilor; Chair, Committee on Planning, Development & Transportation",
          when: "July 2025",
          context: "Addressing Waymo representatives at the hearing.",
          url: "https://www.wgbh.org/news/local/2025-07-24/driverless-cars-run-into-resistance-at-boston-city-council",
        },
      ],
    },
    {
      id: "dc",
      name: "Washington, D.C.",
      congestionHours: 70,
      congestionCostPerDriver: null,
      congestionCityCost: null,
      casualties: {
        deaths: {
          count: 52,
          year: 2023,
          source: "DDOT Vision Zero crash dashboard (MPD data via Open Data DC); reported by The Washington Post, Aug. 23, 2024.",
          sourceUrl: "https://www.washingtonpost.com/dc-md-va/2024/08/23/vision-zero-dc-traffic-deaths/",
        },
        injuries: {
          count: 363,
          year: 2023,
          label: "people with major injuries",
          source: "DDOT Vision Zero crash dashboard; reported by The Washington Post, Aug. 23, 2024.",
          sourceUrl: "https://www.washingtonpost.com/dc-md-va/2024/08/23/vision-zero-dc-traffic-deaths/",
        },
      },
      status:
        "No driverless service. District law still requires a licensed human driver inside an " +
        "autonomous vehicle. The Council's Committee on Transportation and the Environment is " +
        "weighing the Autonomous Vehicle Deployment Authorization Amendment Act of 2026; even " +
        "supporters say commercial driverless service is unlikely before roughly 2028. Observers " +
        "have described the District's status as 'regulatory limbo.'",
      statusSourceUrl: "https://www.planetizen.com/news/2026/02/136936-waymos-dc-rollout-stuck-regulatory-limbo",
      quotes: [
        {
          text:
            "Without the right protections for workers and for the residents of the city, we " +
            "believe this will have a negative impact… it would frankly take money away from " +
            "not just workers but from local businesses.",
          who: "Jaime Contreras",
          role: "Executive Vice President, 32BJ SEIU",
          when: "July 2026",
          context: "Testifying at the DC Council hearing on the autonomous-vehicle bill.",
          url: "https://wjla.com/news/local/dc-bill-autonomous-vehicles-robotaxi-robotaxis-self-driving-cars-driverless-washington-council-charles-allen-waymo-transportation-tech-ai-rideshare-public-safety-traffic-hearing",
        },
        {
          text:
            "I believe the city needs to be a place that embraces innovation — [but] makes " +
            "sure it works for D.C.",
          who: "Charles Allen",
          role: "D.C. Councilmember (Ward 6); sponsor of the AV bill",
          when: "July 2026",
          context: "Describing the bill as creating a gated 'pathway' rather than open deployment.",
          url: "https://wjla.com/news/local/dc-bill-autonomous-vehicles-robotaxi-robotaxis-self-driving-cars-driverless-washington-council-charles-allen-waymo-transportation-tech-ai-rideshare-public-safety-traffic-hearing",
        },
        {
          text:
            "[Concerned about] adding autonomous vehicles to the city's already complex traffic mix.",
          who: "Cathy Chase",
          role: "President, Advocates for Highway and Auto Safety",
          when: "2026",
          context: "Paraphrased from reporting on the Council hearing; not a verbatim quote.",
          url: "https://www.wusa9.com/article/tech/waymo-autonomous-vehicles-self-driving-dc-council-ethan-teicher-advocates-highway-auto-safety/65-902851dc-0be6-4712-87b6-822ae2ea5d6f",
          paraphrase: true,
        },
      ],
    },
  ],

  /* ---- Default assumptions for the scenario model (user-adjustable in the UI) ---- */
  model: {
    startYearDefault: 2021,
    startYearMin: 2018,
    startYearMax: 2024,
    yearsTo50Default: 3, // years from start until autonomous vehicles cover 50% of miles
    yearsTo50Min: 2,
    yearsTo50Max: 8,
    reductionDefault: 0.85, // share of fatal-injury crashes avoided on autonomous miles
    reductionMin: 0.5,
    reductionMax: 0.92,
    shareCap: 0.95, // you never get to 100% of miles
    caveats: [
      "This is a what-if model, not a measurement. It multiplies real road-death counts by an assumed share of miles driven autonomously and an assumed crash-reduction rate.",
      "It assumes autonomous miles are at least as safe as Waymo's published record generalizes — across weather, road types, and cities where that is not yet demonstrated.",
      "It does not model a faster rollout's own new risks, the pace at which vehicles and infrastructure could realistically be replaced, or second-order effects on total miles driven.",
      "The medical-bill tally applies NHTSA's 2019 medical-cost estimate ($30.9B/yr) as a flat running rate, scaled by the same share and reduction assumptions; it is not inflation-adjusted and treats every year's crash mix as 2019's.",
      "Real deployment involves genuine trade-offs this page doesn't score: driving jobs, liability, data and privacy, and accessibility.",
    ],
  },
};
