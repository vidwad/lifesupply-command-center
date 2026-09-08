export const LIFE_SUPPLY_ROUTES = {
  home: "/",
  about: "/about-us/",
  operations: "/our-operations/",
  team: "/our-team/",
  investorRelations: "/investor-relations/",
  news: "/news/",
  contact: "/contact/",
  legacyContact: "/contact-2/",
  shop: "/shop/",
} as const;

export const LIFE_SUPPLY_NAVIGATION = [
  { label: "About us", href: LIFE_SUPPLY_ROUTES.about },
  { label: "Our operations", href: LIFE_SUPPLY_ROUTES.operations },
  { label: "Our team", href: LIFE_SUPPLY_ROUTES.team },
  { label: "Investor relations", href: LIFE_SUPPLY_ROUTES.investorRelations },
  { label: "News", href: LIFE_SUPPLY_ROUTES.news },
  { label: "Contact", href: LIFE_SUPPLY_ROUTES.contact },
] as const;

export const LIFE_SUPPLY_CONTENT = {
  brand: {
    name: "LifeSupply Health",
    image: "/lsh/lifesupply-mark.png",
    portfolioImage: "/lsh/lifesupply-portfolio-lockup.png",
    address: [
      "Lifesupply Health Supplies Inc.",
      "6911 King George Highway",
      "Surrey, British Columbia V3W 5A1",
      "Canada",
    ],
  },
  homepage: {
    eyebrow: "LifeSupply Health Supplies Inc.",
    title: "Health and medical supply infrastructure for a changing market.",
    description:
      "LifeSupply is an established ecommerce and supply-platform company serving health, safety, medical, and industrial product categories across Canada and the United States.",
    pillars: [
      {
        index: "01",
        title: "Experienced",
        text: "A decade of public medical-supplies industry experience and a founding team spanning operations, capital markets, and healthcare expertise.",
      },
      {
        index: "02",
        title: "Integrated",
        text: "Online commerce, distribution, retail, wholesale, and pharmaceutical-development themes are reflected across the current public operating narrative.",
      },
      {
        index: "03",
        title: "Growing",
        text: "The public growth strategy focuses on complementary operations, broader product access, and commercial platform expansion.",
      },
    ],
    publicMetrics: [
      { value: "25+", label: "years of operations cited in the 2025 annual report" },
      { value: "50K+", label: "products cited in the 2025 annual report" },
      { value: "1M+", label: "customers served cited in the 2025 annual report" },
    ],
  },
  about: {
    mission:
      "Through a commitment to technology, innovation, and excellence, LifeSupply aims to serve a broad customer base with premium products, competitive pricing, and direct access.",
    vision:
      "The public vision is to become a global leader in the online sale and distribution of health and medical products and related services.",
    growth:
      "The current annual-report narrative describes a platform strategy combining operating discipline, technology deployment, complementary acquisitions, and Canadian and United States market reach. Forward-looking activities remain subject to approval and disclosure context.",
    brands: [
      {
        name: "LifeSupply",
        description: "Online retail sales of medical products.",
        url: "https://lifesupply.ca",
      },
      {
        name: "Med Direct",
        description: "Distribution of medical products.",
        url: "https://meddirect.ca",
      },
      {
        name: "Dexton Medical",
        description:
          "Flagship retail, pharmacy, and medical-clinic brand in the current public portfolio.",
        url: "https://dexton.com",
      },
    ],
  },
  operations: [
    {
      title: "Online ecommerce division",
      description:
        "Publicly described online channels intended to provide medical products to a broad customer base.",
    },
    {
      title: "Distribution & drop ship facility",
      description:
        "A centralized fulfillment, delivery, and logistics function described as having access to distributors, manufacturers, and suppliers.",
    },
    {
      title: "Flagship retail operations",
      description:
        "A bricks-and-mortar retail setting intended to showcase LifeSupply’s top-selling products.",
    },
    {
      title: "Wholesale division",
      description:
        "An institutional-supply focus spanning hospitals, universities, nursing homes, First Nations, and government agencies in the current public overview.",
    },
    {
      title: "Pharmaceutical",
      description:
        "A stated development focus around pharmacy-related operations and regulated care infrastructure, subject to current regulatory, operational, and partner confirmation.",
    },
  ],
  team: {
    management: [
      {
        name: "Abdul Ladha",
        role: "Chairman & CEO",
        slug: "abdul-ladha",
        summary:
          "Electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience.",
        image: "/lsh/abdul-ladha.jpg",
      },
      {
        name: "Ben Hastibakhsh",
        role: "Business Development",
        slug: "ben-hastibakhsh",
        summary:
          "VP of Business Development and co-founder of Wellmart Health, with a public record in home medical equipment growth.",
      },
      {
        name: "Gary Li",
        role: "Finance",
        slug: "gary-li",
        summary:
          "VP of Finance with more than 11 years of management experience across private and public companies.",
      },
      {
        name: "Craig Loverock",
        role: "Finance",
        slug: "craig-loverock",
        summary:
          "Financial executive with more than 25 years in accounting and finance roles in North America and the United Kingdom.",
      },
      {
        name: "Mike Gill",
        role: "Retail Operations",
        slug: "mike-gill",
        summary:
          "Retail operations leader with experience across national retailers and flagship store launches.",
      },
      {
        name: "Chris Ishola",
        role: "Finance",
        slug: "christopher-ishola",
        summary:
          "Chartered Professional Accountant with more than 30 years of experience across manufacturing and healthcare sectors.",
      },
      {
        name: "Ross Jelveh",
        role: "Integration",
        slug: "ross-jelveh-2",
        summary:
          "Technology and business leader with experience in enterprise-level application integration and ecommerce optimization.",
      },
    ],
    board: [
      "Abdul Ladha",
      "Keith Dolo",
      "Barrett Sleeman",
      "Dr. David Vogt",
      "Dr. Margaret Clarke",
      "Dr. Dedeshya Holowenko",
    ],
    legacyProfiles: [
      {
        slug: "abdul-ladha",
        name: "Abdul Ladha",
        role: "Director",
        bio: "Abdul Ladha is an electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience. His legacy profile notes that he was Chairman and CEO of Ableauctions.com Inc., founded the Spark Global Philanthropic Foundation, and periodically instructed at the Sauder School of Business, University of British Columbia.",
      },
      {
        slug: "ben-hastibakhsh",
        name: "Ben Hastibakhsh",
        role: "VP of Business Development / Co-Founder, Wellmart",
        bio: "The legacy profile identifies Ben Hastibakhsh as VP of Business Development and co-founder of Wellmart Health Supplies Ltd., a division of LifeSupply Health. It cites more than 20 years of business-development, marketing, and public-relations experience.",
      },
      {
        slug: "gary-li",
        name: "Gary Li",
        role: "VP of Finance",
        bio: "The legacy profile identifies Gary Li as a CPA, CA with more than 11 years of accounting and finance experience. It notes prior roles in senior finance management and business-transformation and acquisition projects.",
      },
      {
        slug: "craig-loverock",
        name: "Craig Loverock",
        role: "Chief Financial Officer",
        bio: "The legacy profile identifies Craig Loverock as a CPA, CA with more than 25 years of accounting and finance experience in Canada, the United States, and England. It references prior public-company finance and audit-committee roles.",
      },
      {
        slug: "mike-gill",
        name: "Mike Gill",
        role: "Manager, Warehouse Dropship Centre",
        bio: "The legacy profile describes Mike Gill as having 20 years of retail-management and operations experience, including flagship retail-store launches and work with national retailers.",
      },
      {
        slug: "christopher-ishola",
        name: "Christopher Ishola",
        role: "Systems & Operations",
        bio: "The legacy profile identifies Christopher Ishola as a Chartered Professional Accountant with more than 30 years of experience spanning manufacturing and healthcare. It references accounting, audit, review, tax, and private- and public-company advisory work.",
      },
      {
        slug: "ross-jelveh-2",
        name: "Ross Jelveh",
        role: "VP Technology",
        bio: "The legacy profile describes Ross Jelveh as a technologist and certified software engineer with 20 years of technology and business experience. It references enterprise application integration and ecommerce optimization work.",
      },
      {
        slug: "keith-dolo-2",
        name: "Keith Dolo",
        role: "Director",
        bio: "The legacy profile states that Keith Dolo holds an honours commerce degree and has a track record in finance and accounting, including prior leadership with Robert Half International and entrepreneurial experience in high-growth ecommerce brands.",
      },
      {
        slug: "barrett-e-g-sleeman",
        name: "Barrett E. G. Sleeman",
        role: "Director",
        bio: "The legacy profile identifies Barrett Sleeman as a Professional Engineer with a career in resource development and finance, including public-company officer and director roles and prior emergency medical technician and first-responder experience.",
      },
      {
        slug: "david-vogt",
        name: "Dr. David Vogt",
        role: "Director",
        bio: "The legacy profile describes Dr. David Vogt as a Vancouver-based scientist and innovation leader with interdisciplinary doctoral training, company-launch experience, governance roles, and graduate teaching work at the University of British Columbia.",
      },
      {
        slug: "dr-margaret-clarke-2",
        name: "Dr. Margaret Clarke",
        role: "Director",
        bio: "The legacy profile describes Dr. Margaret Clarke as a developmental pediatrician with honours recognized by the Alberta Medical Association and experience in child health, remote care settings, Indigenous communities, and women’s shelters.",
      },
      {
        slug: "dr-dedeshya-holowenko",
        name: "Dr. Dedeshya Holowenko",
        role: "Director",
        bio: "The legacy profile describes Dr. Dedeshya Holowenko as a physician with certification in family medicine, emergency medicine, and women’s health. It references teaching, physician-program governance, and advisory work related to women’s pharmaceutical treatments.",
      },
      {
        slug: "john-anderson-2",
        name: "John Anderson",
        role: "Director",
        bio: "The legacy profile identifies John Anderson as a mergers-and-acquisitions attorney and partner with Stikeman Elliott, with more than 30 years of experience on major Canadian transactions.",
      },
    ],
  },
  investorRelations: {
    title: "Investor information, presented with context.",
    description:
      "The investor section presents current annual-report context alongside historical news and materials, with a clear distinction between disclosed information, forward-looking statements, and offering-specific content.",
    preview: "/lsh/investor-presentation-preview.png",
    contact: { email: "invest@lifesupply.com", phone: "604-677-4146" },
    currentReport: {
      period: "Year ended December 31, 2025",
      status: "Unaudited consolidated financial information",
      highlights: [
        { label: "Net sales", value: "$6.75M" },
        { label: "Gross profit", value: "$2.20M" },
        { label: "Net income", value: "$284K" },
      ],
    },
    expansionContext: {
      date: "August 25, 2026",
      title: "Expansion strategy source material",
      description:
        "A supplied financing presentation outlines proposed metabolic-health and therapeutics expansion themes, subject to investor suitability, forward-looking disclosure, board approval, regulatory requirements, and final transaction terms.",
    },
  },
  news: [
    {
      date: "June 14, 2022",
      title: "LifeSupply joins forces with Mothers Choice Products",
      source: "Newswire",
      href: "https://www.newswire.ca/news-releases/lifesupply-joins-forces-with-mothers-choice-products-for-online-distribution-of-top-tier-maternal-health-products-808815327.html",
    },
    {
      date: "May 11, 2022",
      title: "LifeSupply expands distribution partnership with Ortho Active",
      source: "Newswire",
      href: "https://www.newswire.ca/news-releases/lifesupply-expands-distribution-partnership-with-ortho-active-864792320.html",
    },
    {
      date: "April 21, 2022",
      title: "LifeSupply appoints Dr. Margaret Clarke to its Board of Directors",
      source: "Yahoo Finance",
      href: "https://ca.finance.yahoo.com/news/lifesupply-appoints-dr-margaret-clarke-150000607.html",
    },
    {
      date: "April 5, 2022",
      title: "LifeSupply acquires Smart Move Medical assets",
      source: "Yahoo News",
      href: "https://www.yahoo.com/now/lifesupply-announces-acquisition-medical-supplies-150000544.html",
    },
  ],
  contact: {
    channels: [
      {
        label: "Investor relations",
        name: "Investor Relations",
        email: "invest@lifesupply.com",
        phone: "604-677-4146",
      },
      {
        label: "Online sales & product lines",
        name: "Ben Hastibakhsh",
        email: "ben@lifesupply.com",
        phone: "604-551-9538",
      },
      {
        label: "Product showroom & distribution centre",
        name: "Mike Gill",
        email: "mike@dexton.com",
        phone: "604-503-9389",
      },
      {
        label: "Mergers & acquisitions",
        name: "Abdul Ladha",
        email: "abdul@lifesupply.com",
        phone: "604-677-4146",
      },
      { label: "Corporate office", name: "General inquiries", email: "info@lifesupply.com" },
    ],
    subsidiaries: [
      {
        name: "Wellmart Health Supplies Ltd. DBA Lifesupply",
        detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
        phone: "1-855-755-5433",
        url: "https://lifesupply.ca",
      },
      {
        name: "MedDirect Distribution Corporation",
        detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
        phone: "604-551-9538",
        url: "https://meddirect.ca",
      },
      {
        name: "Dexton Medical Corporation",
        detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
        phone: "604-503-9389",
        url: "https://dexton.com",
      },
    ],
  },
  operationsTimeline: "/lsh/operations-timeline.jpg",
} as const;
