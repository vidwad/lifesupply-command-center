/**
 * Medical Supply Solutions copy: the consolidated page at
 * `/medical-supply-solutions/`. Restructured on 2026-09-08 at the product
 * owner's direction from the Stage 3 "Our Businesses" portfolio map, then
 * consolidated on 2026-09-12 (the three store pages and the suppliers page
 * became sections), and expanded on 2026-09-13 into the main commercial
 * explanation of the supply business.
 *
 * Every factual statement traces to a SOURCE_REGISTER.md row, to
 * `docs/website-content-evidence.md`, or to approved copy already published;
 * the rest is business framing the product owner supplied. Store terms
 * (shipping thresholds, delivery times, prices) are never restated here:
 * pages say the store publishes them. No brand-to-entity relationship is
 * asserted (WEB-01). Store and category links come from the brand registry,
 * never from this file: a category names a registry label, and the page
 * resolves it to the verified URL.
 *
 * Current versus proposed. The stores are operating; everything from the
 * clinic-purchasing section onward is a development direction. `status` is
 * the one statement of that, rendered once, and every proposed capability
 * is written conditionally ("would", "could", "we aim to") rather than as
 * something on offer. No savings, availability, service level, price
 * position, or forecast is claimed anywhere on the page.
 */
export const businesses = {
  hub: {
    eyebrow: "Medical Supply Solutions",
    title: "Medical supplies for everyday care and professional practice.",
    description: [
      "LifeSupply connects individuals, caregivers, and healthcare businesses with medical, home-care, and practice supplies through its Canadian and U.S. operating stores.",
      "We are building on that foundation to support more coordinated purchasing, recurring supply needs, and dedicated ordering capabilities for clinics and healthcare organizations.",
    ],
    /** Hero actions, in order of weight: primary, secondary, utility. */
    actions: {
      categories: "Explore supply categories",
      professional: "Discuss business purchasing",
      stores: "Shop our stores",
    },
    /**
     * The one status statement for the page, rendered once between what is
     * operating and what is proposed. Every later section refers back to it
     * with conditional wording rather than repeating it.
     */
    status: {
      eyebrow: "Where things stand",
      text: "Our three online stores are operating today. The purchasing arrangements, supply-planning tools, and dedicated portals described below are proposed capabilities in development.",
    },
    /** The in-page navigation, and the order the sections run in. */
    sections: [
      { href: "#customers", label: "Customers" },
      { href: "#categories", label: "Supply categories" },
      { href: "#market", label: "Market context" },
      { href: "#stores", label: "Our stores" },
      { href: "#professional-buyers", label: "Business purchasing" },
      { href: "#technology", label: "Supply planning" },
      { href: "#portals", label: "Supply portals" },
      { href: "#foundation", label: "Foundation" },
      { href: "#suppliers", label: "Suppliers" },
    ],

    /** Two audiences, related but commercially different. */
    customers: {
      eyebrow: "Who we serve",
      title: "Different customers. Different supply needs.",
      intro:
        "Retail and organizational purchasing are related, but they are not the same job. One is finding and replacing the right products; the other is keeping supplies consistent across people, locations, and time.",
      needsLabel: "What they need",
      propositionLabel: "What LifeSupply offers",
      panels: [
        {
          key: "home",
          graphic: "audienceHome",
          eyebrow: "For individuals and caregivers",
          needs:
            "Finding suitable products, understanding product specifications, replacing everyday supplies, and accessing equipment for home use.",
          proposition:
            "Accessible online shopping, recognizable categories, clear product information, and straightforward support.",
          paragraphs: [
            "Medical and home-care needs often extend beyond a single purchase. Equipment may be needed to support mobility or monitoring, while consumables must be replaced regularly.",
            "LifeSupply’s operating stores provide access to products for everyday care, with category information and support to help customers navigate their purchases.",
          ],
          href: "#categories",
          actionLabel: "Explore supply categories",
        },
        {
          key: "organizations",
          graphic: "audienceClinic",
          eyebrow: "For clinics and healthcare organizations",
          needs:
            "Consistent purchasing, approved products, repeat ordering, multiple users or locations, delivery planning, and spending visibility.",
          proposition:
            "Existing supply access, with an expansion direction toward structured purchasing and dedicated ordering capabilities.",
          paragraphs: [
            "A practice needs supplies to be available when its staff need them. Purchasing becomes more complex as product ranges, users, and locations increase.",
            "LifeSupply’s expansion direction is to support these requirements through more coordinated product selection, purchasing workflows, and recurring supply arrangements.",
          ],
          /** The kinds of organization this is for: types, never named accounts. */
          audiences:
            "Organizations of this kind include clinic groups, rehabilitation practices, home-care organizations, and senior-care operators.",
          href: "#professional-buyers",
          actionLabel: "Discuss business purchasing",
        },
      ],
    },

    /**
     * The category explorer. Each category names the registry labels of the
     * verified store category pages that carry it; the page resolves them
     * through `getBrandCategory`, so a link here can only ever be one the
     * registry has observed on the store. A category with no entry for a
     * store is simply not carried there, and nothing is guessed.
     */
    categories: {
      eyebrow: "Supply categories",
      title: "Supplies that support care at home and across the practice.",
      intro:
        "Products are organized here by recognizable needs rather than by store. Each category shows which operating stores carry relevant products, and every link goes to that store’s own category page.",
      filterLabel: "Show",
      filters: [
        { key: "all", label: "All categories" },
        { key: "home", label: "Home & personal care" },
        { key: "practice", label: "Professional practice" },
      ],
      storesLabel: "Available through",
      /** Read out when a filter changes; `{n}` is the count shown. */
      countLabel: "Showing {n} of 8 categories",
      /** Pictures illustrate the category, and are never a specific product. */
      imageNote:
        "Images illustrate each category. They are not specific products, and product availability is shown on the store’s own page.",
      items: [
        {
          slug: "mobility",
          title: "Mobility & Daily Living",
          description: "Mobility aids and practical products that support everyday activities.",
          groups: ["home", "practice"],
          graphic: "brandWellmart",
          stores: [
            { brand: "lifesupply", categories: ["Mobility aids"] },
            { brand: "wellmart", categories: ["Mobility", "Home medical equipment"] },
            { brand: "balkowitsch", categories: ["Living aids"] },
          ],
        },
        {
          slug: "bathroom-safety",
          title: "Bathroom Safety & Home Care",
          description: "Equipment and accessories for bathroom safety and care at home.",
          groups: ["home"],
          graphic: "categoryBathroom",
          stores: [{ brand: "wellmart", categories: ["Bath safety", "Home medical equipment"] }],
        },
        {
          slug: "monitoring",
          title: "Monitoring & Diagnostics",
          description:
            "Equipment and accessories for measuring and monitoring, with selection based on product specifications and professional guidance where appropriate.",
          groups: ["home", "practice"],
          graphic: "categoryMonitoring",
          stores: [
            {
              brand: "lifesupply",
              categories: ["Blood glucose meters", "Biometric monitors", "Medical thermometers"],
            },
            { brand: "wellmart", categories: ["Health monitors"] },
            { brand: "balkowitsch", categories: ["Digital measuring devices"] },
          ],
        },
        {
          slug: "wound-care",
          title: "Wound Care & First Aid",
          description:
            "Dressings, bandages, and supplies for first-aid and wound-care requirements.",
          groups: ["home", "practice"],
          graphic: "categoryWound",
          stores: [
            { brand: "lifesupply", categories: ["First aid"] },
            { brand: "wellmart", categories: ["Skin and wound"] },
            { brand: "balkowitsch", categories: ["Wound care"] },
          ],
        },
        {
          slug: "clinic-dental",
          title: "Clinic & Dental Supplies",
          description: "Everyday consumables and supplies for professional practice.",
          groups: ["practice"],
          graphic: "categoryClinicDental",
          stores: [
            { brand: "lifesupply", categories: ["Clinic supplies", "Dental clinic supplies"] },
          ],
        },
        {
          slug: "injection-diabetes",
          title: "Injection & Diabetes Supplies",
          description: "Device-specific supplies and accessories for prescribed care routines.",
          groups: ["home", "practice"],
          graphic: "categoryInjection",
          stores: [
            { brand: "lifesupply", categories: ["Needles and syringes", "Diabetic"] },
            { brand: "wellmart", categories: ["Needles and syringes", "Diabetic"] },
          ],
        },
        {
          slug: "incontinence-ostomy",
          title: "Incontinence & Ostomy Care",
          description: "Everyday care products and accessories for individual needs.",
          groups: ["home"],
          graphic: "categoryIncontinence",
          stores: [{ brand: "wellmart", categories: ["Incontinence", "Ostomy"] }],
        },
        {
          slug: "respiratory",
          title: "Respiratory Care",
          description:
            "Respiratory equipment and accessories available through the relevant store.",
          groups: ["home", "practice"],
          graphic: "categoryRespiratory",
          stores: [{ brand: "wellmart", categories: ["Respiratory"] }],
        },
      ],
    },

    /**
     * Market context: population aging as the reason these categories matter,
     * never as a forecast of the business. Every figure is a published
     * statistical measure with its geography, date and source
     * (docs/website-content-evidence.md, "Market context"); the projection is
     * stated as a direction, because no projected figure is published here.
     */
    market: {
      eyebrow: "Market context",
      title: "Aging populations. Ongoing supply needs.",
      paragraphs: [
        "As populations age, access to home-care equipment, monitoring products, and recurring medical supplies becomes increasingly important.",
        "For individuals and caregivers, the challenge is finding and replenishing suitable products. For healthcare organizations, it is coordinating purchasing and maintaining appropriate supplies across the settings where care is delivered.",
        "LifeSupply’s opportunity is to serve these purchasing needs through its operating stores and develop more structured supply relationships with professional buyers.",
      ],
      chart: {
        title: "People aged 65 and older",
        canada: {
          geography: "Canada",
          measure: "Share of the population aged 65 and older",
          unit: "%",
          /** Census counts for 2016 and 2021; the July 1, 2025 estimate. */
          points: [
            { year: "2016", value: 16.9, kind: "historical" },
            { year: "2021", value: 19.0, kind: "historical" },
            { year: "2025", value: 19.5, kind: "historical" },
          ],
          /** July 1, 2025: about 8.1 million people. */
          note: "About 8.1 million people on July 1, 2025.",
          projection: {
            label: "Projection",
            text: "Statistics Canada’s 2024 to 2074 projections have the share continuing to rise under every scenario. No projected figure is shown here.",
          },
        },
        us: {
          geography: "United States",
          measure: "Population aged 65 and older",
          unit: "million",
          points: [
            { year: "2010", value: 40.3, kind: "historical" },
            { year: "2020", value: 55.8, kind: "historical" },
          ],
          note: "An increase of 38.6% over the decade, and 16.8% of the population in 2020.",
        },
        legend: {
          historical: "Historical: census counts and population estimates",
          projection: "Projection: direction only",
        },
        sources:
          "Sources: Statistics Canada, Census of Population 2016 and 2021 (The Daily, April 27, 2022); Canada’s population estimates: age and gender, July 1, 2025 (The Daily, September 24, 2025); Population Projections for Canada, Provinces and Territories, 2024 to 2074 (January 21, 2025). U.S. Census Bureau, 2020 Census (May 25, 2023).",
        qualification:
          "These are historical measures of population, not a medical-supply sales rate and not a forecast of LifeSupply’s business.",
      },
    },

    stores: {
      eyebrow: "Operating stores",
      title: "Established stores. Access to products today.",
      intro: [
        "LifeSupply and Wellmart Medical serve Canadian customers. Balkowitsch Worldwide serves the U.S. market.",
        "Each store manages its own catalogue, pricing, accounts, and customer service. Purchases are completed on the store’s website.",
      ],
      shopLabel: "Shop",
    },
    ordering: {
      eyebrow: "Ordering & support",
      title: "Ordering and support, through your store.",
      intro:
        "Browse and purchase on the operating store’s website. For an existing order, contact the store where you purchased.",
      disclosures: [
        {
          question: "Where do I place an order?",
          answer:
            "Follow a store or category link on this page to browse and purchase. Checkout takes place on that store’s website.",
        },
        {
          question: "Which currency and delivery terms apply?",
          answer:
            "LifeSupply and Wellmart Medical price in Canadian dollars. Balkowitsch Worldwide prices in U.S. dollars. Check the selected store for delivery availability, shipping charges, returns, and current policies.",
        },
        {
          question: "Who can help with an existing order?",
          answer:
            "The store that accepted your order handles delivery questions, returns, and order support.",
        },
      ],
      supportLabel: "Support",
      supportLinks: [
        { brand: "lifesupply", label: "LifeSupply support" },
        { brand: "wellmart", label: "Wellmart support" },
        { brand: "balkowitsch", label: "Balkowitsch support" },
      ],
    },

    /** Clinic and institutional purchasing: the problems, the direction, the proposed capabilities, and what to bring. */
    professional: {
      eyebrow: "Clinic & institutional purchasing",
      title: "From individual orders to coordinated purchasing.",
      problemsTitle: "Familiar purchasing problems",
      problems: [
        "Different staff ordering similar items under different descriptions.",
        "Time spent rebuilding recurring orders.",
        "Limited visibility across locations.",
        "Inconsistent product selection.",
        "Unplanned purchases when supplies run low.",
        "Difficulty tracking backorders and delivery expectations.",
      ],
      paragraphs: [
        "LifeSupply is looking to develop purchasing arrangements around the way a clinic or organization operates: the products it uses, the people authorized to order, the locations it serves, and the frequency of its supply needs.",
        "The objective is to make routine purchasing easier to manage through agreed product lists, clearer ordering responsibilities, and better visibility into demand and fulfilment.",
      ],
      capabilitiesTitle: "Capabilities we propose to introduce",
      capabilityLabel: "Proposed capability",
      valueLabel: "What it would do for a customer",
      capabilities: [
        {
          name: "Approved product lists",
          value: "Help staff order the products their organization has selected.",
        },
        {
          name: "Saved and repeat orders",
          value: "Reduce the work involved in routine purchasing.",
        },
        {
          name: "User permissions and approvals",
          value: "Align purchasing with organizational responsibilities.",
        },
        {
          name: "Location-specific catalogues",
          value: "Reflect the needs of different clinics or facilities.",
        },
        {
          name: "Order and spending visibility",
          value: "Help purchasing teams understand activity.",
        },
        {
          name: "Replenishment planning",
          value: "Support review of recurring requirements before urgent orders arise.",
        },
      ],
      /** Proposed, and nothing promised: no savings, availability, or service level. */
      capabilitiesNote:
        "These are proposed capabilities. No savings, product availability, or service level is promised, and each capability would be agreed with the organization concerned.",
      checklistTitle: "What to bring to the conversation",
      checklist: [
        "Your organization, location, and type of practice.",
        "The product categories you purchase regularly.",
        "Any specific equipment or product requirements.",
        "Your purchasing frequency and delivery requirements.",
      ],
      action: "clinic_supply_review",
      actionLabel: "Request a supply review",
      supportingAction: "clinic_ongoing_supplies",
      supportingLabel: "Explore clinic supplies & equipment",
      /**
       * What the conversation is, and is not. It starts a purchasing
       * discussion; it does not create pricing, credit, billing, integration,
       * replenishment or a subscription, none of which is offered.
       */
      note: "Orders follow the supplying store’s terms. Any additional purchasing or service arrangements must be agreed separately.",
    },

    /**
     * Technology, described through what it could do for a customer and the
     * information it would need. Demand can be estimated from order history;
     * shortage risk also needs reliable supplier and lead-time information,
     * which is why the wording is an objective and never a guarantee.
     */
    technology: {
      eyebrow: "Technology & supply planning",
      title: "Better supply decisions start with better information.",
      paragraphs: [
        "We aim to use purchasing patterns and supplier information to identify emerging supply risks earlier and help customers plan their requirements.",
        "Order history can help estimate demand. Identifying shortage risk also depends on dependable supplier availability and lead-time information, so these capabilities are being developed in that order: product data first, then supplier inputs, then reporting and automation.",
      ],
      capabilityLabel: "Proposed capability",
      whatLabel: "What it could do",
      benefitLabel: "Customer benefit",
      capabilities: [
        {
          name: "Demand forecasting",
          what: "Use order history, recurring patterns, and agreed stock requirements to estimate future needs.",
          benefit: "Earlier visibility into likely purchasing requirements.",
        },
        {
          name: "Supply-risk monitoring",
          what: "Compare supplier availability, lead times, backorders, and demand.",
          benefit: "Earlier identification of potential fulfilment problems.",
        },
        {
          name: "Replenishment automation",
          what: "Prepare reminders or draft orders based on agreed rules.",
          benefit: "Less repetitive administration.",
        },
        {
          name: "Catalogue management",
          what: "Improve product descriptions, units, identifiers, and specifications.",
          benefit: "Fewer ordering errors and easier product comparison.",
        },
        {
          name: "Pricing management",
          what: "Review costs, freight, purchasing terms, and applicable market information.",
          benefit: "More consistent and commercially responsive pricing.",
        },
        {
          name: "Purchasing analytics",
          what: "Summarize usage and spending by category or location.",
          benefit: "Better visibility for purchasing teams.",
        },
      ],
      /**
       * Pricing, described as disciplined management. No lowest-price or
       * guaranteed-savings claim, and nothing that could read as prices
       * moving with a customer's urgency or vulnerability.
       */
      pricing: {
        title: "Pricing intelligence and purchasing efficiency.",
        paragraphs: [
          "Better pricing tools would help LifeSupply respond to changes in supplier costs, freight, purchasing volumes, and market conditions while managing product margins consistently.",
          "For organizational customers, the objective would be to support pricing arrangements that reflect agreed terms, product requirements, and purchasing relationships.",
        ],
      },
    },

    /** Dedicated supply portals: the proposed next capability, its lifecycle, and an illustrative concept. */
    portal: {
      eyebrow: "Dedicated supply portals",
      title: "A supply portal built around your organization.",
      paragraphs: [
        "LifeSupply’s proposed next step is to help clinics and healthcare organizations design, build, and maintain dedicated supply-ordering portals.",
        "A portal could bring approved products, purchasing permissions, recurring orders, and location-specific requirements into one interface, configured around the organization’s workflow and the agreed supply arrangements.",
        "The intent is to connect product access with a more organized purchasing experience, while maintaining clear responsibilities for pricing, fulfilment, and support.",
      ],
      lifecycleTitle: "How a portal would be developed.",
      lifecycle: [
        {
          index: "01",
          title: "Discover",
          text: "Understand users, locations, product requirements, purchasing processes, and existing systems.",
        },
        {
          index: "02",
          title: "Design",
          text: "Define the catalogue, permissions, approvals, pricing rules, and reporting needs.",
        },
        {
          index: "03",
          title: "Build and connect",
          text: "Configure the portal and agreed connections to commerce, supplier, or purchasing systems.",
        },
        {
          index: "04",
          title: "Pilot",
          text: "Test a limited catalogue and workflow with designated users.",
        },
        {
          index: "05",
          title: "Maintain and improve",
          text: "Update products, manage access, support users, monitor connections, and refine the experience.",
        },
      ],
      /** A digital service, distinct from the physical clinic work LifeSupply Clinics does. */
      distinction:
        "Portal design and development is a digital service. It is separate from the physical clinic design and construction that LifeSupply Clinics delivers; both can form part of a broader relationship, but they are agreed separately.",
      connecting:
        "For new clinic projects in British Columbia, equipment planning and opening supplies can provide the starting point for a longer-term purchasing relationship. Dedicated ordering capabilities would be developed and agreed separately.",
      concept: {
        /** Always visible above the prototype, so a realistic interface never reads as a live product. */
        label: "Illustrative portal concept — proposed capabilities",
        note: "Demonstration data is fictional. No live product, organization, account, or order is shown.",
        viewsLabel: "Portal views",
        views: [
          { key: "catalogue", label: "Catalogue" },
          { key: "purchasing", label: "Purchasing" },
          { key: "reporting", label: "Reporting" },
        ],
      },
      action: "portal_inquiry",
      actionLabel: "Discuss a dedicated supply portal",
    },

    /** The foundation: four evidence points and a short paragraph, no feature list. */
    foundation: {
      eyebrow: "LifeSupply’s foundation",
      title: "Building on the business already in place.",
      points: [
        {
          title: "Online supply businesses in Canada and the United States",
          text: "Three operating stores, each with its own catalogue, accounts, and customer service.",
        },
        {
          title: "Product and category experience across home and professional care",
          text: "From mobility and monitoring at home to clinic and dental consumables for practice.",
        },
        {
          title: "Established customer and supplier relationships",
          text: "Customers served across the stores, and suppliers whose products are reviewed and listed through them.",
        },
        {
          title: "Clinic-development and equipment relationships in British Columbia",
          text: "LifeSupply Clinics’ project work brings equipment planning and opening supplies into view.",
        },
      ],
      paragraphs: [
        "LifeSupply’s expansion direction builds on an existing supply business. Its online stores provide product access today, while its clinic relationships create opportunities to understand equipment and recurring supply requirements more closely.",
        "The next step is to connect that experience with better purchasing information, automation, and organization-specific ordering tools.",
        "Technology alone is not the advantage. The opportunity lies in combining usable technology with relevant products, reliable supplier information, and effective customer service.",
      ],
    },

    suppliers: {
      eyebrow: "Suppliers & manufacturers",
      title: "Introduce your products to our supply businesses.",
      paragraphs: [
        "Product breadth is what makes the categories above useful, so we welcome enquiries from suppliers and manufacturers whose products complement the medical, health, home-care, safety, and related categories carried by our operating stores.",
        "Tell us what you supply, the markets you serve, and where you hold distribution rights. Product fit and commercial arrangements are reviewed with the relevant operating business.",
      ],
      requirementsTitle: "What to include",
      requirements: [
        {
          title: "Your business and products",
          text: "Your company, product range, intended customers, and the categories you would like us to consider.",
        },
        {
          title: "Markets and distribution rights",
          text: "The countries or regions you can supply, your distribution rights, and any exclusivity arrangements.",
        },
        {
          title: "Product information",
          text: "Descriptions, images, specifications, applicable regulatory identifiers, and your pricing structure.",
        },
        {
          title: "Commercial requirements",
          text: "Lead times, minimum order quantities, return arrangements, and product-support terms.",
        },
      ],
      processTitle: "From introduction to listing.",
      process: [
        {
          index: "01",
          title: "Introduce",
          text: "Send a short overview of your business, products, and proposed markets.",
        },
        {
          index: "02",
          title: "Review",
          text: "The relevant business reviews category fit, distribution rights, product information, and applicable requirements.",
        },
        {
          index: "03",
          title: "Agree",
          text: "Commercial terms and supply responsibilities are agreed with the operating store.",
        },
        {
          index: "04",
          title: "List",
          text: "Approved products are added through the store’s catalogue process.",
        },
      ],
      action: "supplier_inquiry",
      actionLabel: "Submit a supplier enquiry",
      /** An introduction is reviewed for fit; it is not an acceptance. */
      note: "Initial enquiries are reviewed for fit; submitting information does not establish a supply agreement.",
    },

    /** Audience-specific closing actions: shop, discuss purchasing, discuss a portal. */
    closing: {
      title: "Where would you like to start?",
      text: "Shop with a store today, or talk to us about purchasing for your organization. A portal enquiry concerns a proposed capability, not an existing product.",
      shopHref: "#stores",
      shopLabel: "Shop products",
      purchasingAction: "institutional_purchasing",
      purchasingLabel: "Discuss clinic or institutional purchasing",
      portalAction: "portal_inquiry",
      portalLabel: "Discuss a dedicated supply portal",
    },
  },
} as const;
