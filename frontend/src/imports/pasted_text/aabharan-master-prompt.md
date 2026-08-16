MASTER PROMPT – AABHARAN CUSTOMER WEBSITE & JEWELLERY STORE PORTAL

You are a Senior Product Designer, UI/UX Architect, Full Stack Developer, System Architect, and Database Engineer.

Design and build a complete production-ready platform called AABHARAN.

AABHARAN is NOT an e-commerce platform. Customers cannot purchase jewellery online. Instead, AABHARAN is a premium jewellery discovery and enquiry platform where jewellery stores showcase their collections and customers can connect directly with them.

The platform consists of only two interfaces:

Customer Website

Jewellery Store Portal (Sponsor Dashboard)

The Admin Panel is a completely separate application and should NOT be included in this project.

Technology Stack

Build using:

 Next.js 15 (App Router)

 TypeScript

 Tailwind CSS

 Shadcn UI

 Framer Motion

 Prisma ORM

 PostgreSQL (DigitalOcean)

 Firebase Authentication

 DigitalOcean Spaces

 Google Maps API

 React Query

 React Hook Form

 Zod Validation

Design Philosophy

Create a clean, modern, premium platform.

Do NOT use:

 Glitter

 Sparkles

 Gold shine effects

 Overly luxurious decorations

 Heavy gradients

Instead use:

 Blue & White theme

 Minimal design

 Spacious layout

 Rounded cards

 Soft shadows

 Professional typography

 Smooth animations

 Excellent spacing

The design should feel like a modern SaaS product mixed with an e-commerce experience.

Use inspiration from:

 Apple

 Shopify

 Amazon

 Nike

 Airbnb

The UI must not look AI-generated.

Authentication

There are two completely separate login systems.

Customer Authentication

Customers can register.

Signup Fields

 Full Name

 Email Address

 Password

Login

 Email

 Password

Forgot Password

Firebase Authentication.

Jewellery Store Authentication

Jewellery stores cannot register.

Accounts are created externally.

Store owners receive login credentials.

Store Login Fields

 Email

 Password

Forgot Password

Firebase Authentication.

After login, the sponsor only has access to their own store.

CUSTOMER WEBSITE

Header

Sticky Navigation

Contains:

 Aabharan Logo

 Search Bar

 Home

 Categories

 Jewellery Stores

 About

 Contact

 Login

 Signup

White background

Blue navigation

Responsive Mobile Menu

Promotional Banner

Immediately below header.

Large promotional strip.

Examples:

 Wedding Collection Sale

 Festival Discounts

 Akshaya Tritiya Offers

 Diwali Offers

 New Collection Launch

Support:

 Image

 Title

 Subtitle

 CTA Button

Multiple banners rotate automatically.

Hero Carousel

Large image slider.

Promote:

 Featured Jewellery

 Diamond Collection

 Bridal Collection

 Gold Collection

 Sponsor Campaigns

Include:

Auto Play

Manual Navigation

Swipe Support

Fade Animation

Featured Jewellery Stores

Below hero slider.

Display jewellery stores in a horizontal scrollable carousel.

Each card includes:

 Company Logo

 Company Name

Examples:

 Tanishq

 Lalitha Jewellery

 Malabar Gold

 Kalyan Jewellers

 Joyalukkas

Cards should animate slightly on hover.

Horizontal drag support.

Left and right arrow buttons.

Clicking a store opens the Store Profile page.

Store Profile

Each jewellery store has its own page.

Display:

Company Information

 Company Logo

 Cover Banner

 Company Name

 About Company

 Contact Number

 WhatsApp

 Email

 Website

Branches

One company can have multiple branches.

Each branch shows:

 Branch Name

 Address

 City

 State

 Phone

 Google Maps

If the customer shares location:

Show nearest branch first.

Store Gallery

Display featured images.

Product Catalogue

Display all products uploaded by this jewellery store.

Filters:

 Category

 Metal Type

Search products.

Categories

Display categories horizontally.

Examples:

All

Rings

Bangles

Necklaces

Chains

Bracelets

Pendants

Earrings

Anklets

Bridal Sets

Kids Jewellery

Temple Jewellery

Diamond Jewellery

Silver Jewellery

Platinum Jewellery

Metal Filter

Separate filter.

Include:

All

22K Gold

24K Gold

18K Gold

Silver

Sterling Silver

Diamond

Platinum

Product Listing

Responsive product grid.

Each card contains:

Large Product Image

Product Name

Category

Metal Type

Purity

Short Description

Buttons:

View Details

Enquire Now

Product Details

Large image gallery.

Information:

 Product Name

 Category

 Metal Type

 Purity

 Description

Display the jewellery store details.

Show related products.

Provide an enquiry button.

Search

Global Search.

Search:

 Products

 Jewellery Stores

 Categories

Autocomplete suggestions.

Recent searches.

Nearby Jewellery Stores

Ask user permission for location.

If allowed:

Show nearby stores sorted by distance.

Each card displays:

Logo

Store Name

Distance

City

View Store

Customer Profile

Customer can manage:

Profile

Saved Stores

Saved Products

Enquiry History

Settings

Logout

Enquiry System

Every product has an Enquire Now button.

Clicking it opens a modal.

Fields:

 Customer Name

 Email

 Phone Number

 Message

On submit:

Save enquiry in database.

Send enquiry to Jewellery Store Portal.

Email notification to store.

Show success confirmation.

JEWELLERY STORE PORTAL

Only registered sponsor accounts can access this dashboard.

Dashboard

Display KPI cards:

 Total Products

 Featured Products

 Total Enquiries

 New Enquiries

 Product Views

 Store Views

Display simple charts for:

Monthly enquiries.

Popular products.

Most viewed products.

Product Management

Sponsors can:

Add Product

Edit Product

Delete Product

Duplicate Product

Bulk Upload Images

Each product contains:

Product Name

Category

Metal Type

Purity

Weight (Optional)

Description

Featured Product

Display Order

Multiple Images

Support:

Drag-and-drop image upload.

Image cropping.

Image compression.

Image reordering.

Store Management

Sponsors can edit:

Company Logo

Cover Banner

Company Description

Contact Number

WhatsApp

Website

Email

Branches

Google Maps

Business Hours

Social Links

Branch Management

Unlimited branches.

Each branch contains:

Branch Name

Manager Name

Phone

WhatsApp

Address

City

State

Pincode

Latitude

Longitude

Google Maps Preview

Gallery Management

Organize images into collections.

Examples:

Wedding Collection

Diamond Collection

Gold Collection

Silver Collection

Festival Collection

Support:

Multiple image upload.

Drag-and-drop ordering.

Bulk delete.

Bulk update.

Enquiries

Display customer enquiries.

Columns:

Customer Name

Email

Phone

Product

Date

Status

Statuses:

New

In Progress

Contacted

Closed

Search and filter enquiries.

Notifications

Notify sponsor when:

New enquiry received.

Customer viewed featured product.

Product image upload completed.

Performance

Optimize for:

Fast loading.

Image lazy loading.

SEO.

Responsive design.

Accessibility.

Server-side rendering.

Code splitting.

Final Goal

Create a polished, production-ready platform where customers can easily discover jewellery stores and explore their product catalogues, while jewellery stores can effortlessly manage their business profile, branches, galleries, products, and customer enquiries through a dedicated sponsor portal. The entire experience should feel intuitive, modern, scalable, and professionally crafted, delivering a seamless experience on desktop, tablet, and mobile devices without resembling a generic AI-generated template.