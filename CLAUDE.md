# CLAUDE.md - Personal Website Project Information

## Project Overview
This is **Wu Ganglin's** personal website and blog built with Astro. The site showcases his work as a Math Tutor and aspiring Backend Engineer, along with technical blog posts.

**Site URL**: https://ganglin.net  
**Owner**: Ganglin Wu - Math Tutor, Aspiring Backend Engineer, Father of 1

## Technology Stack
- **Framework**: Astro 4.4.4
- **UI Framework**: React 18.2.0 (for interactive components)
- **Styling**: TailwindCSS 3.4.1 with custom theme configuration
- **Content**: MDX support with custom shortcodes
- **Package Manager**: npm (package-lock.json present)
- **TypeScript**: Yes (TypeScript 5.3.3)

## Project Structure
```
src/
├── config/           # Site configuration files
│   ├── config.json   # Main site config (title, profile, settings)
│   └── theme.json    # Theme and styling configuration
├── content/          # Content collections
│   ├── posts/        # Blog posts (8 posts currently)
│   ├── pages/        # Static pages (elements.mdx)
│   └── contact/      # Contact page content
├── layouts/          # Astro layout components
│   ├── shortcodes/   # React components for MDX (Button, Accordion, Tabs, etc.)
│   └── PostSingle.astro
├── pages/            # Astro page routes
├── components/       # Reusable components
├── lib/              # Utility functions
└── styles/           # CSS/SCSS files
```

## Key Features
- **Blog**: Mathematics-focused content (8 posts currently)
- **MDX Support**: Custom shortcodes for rich content (Button, Accordion, Tabs, Video, YouTube)
- **Responsive Design**: TailwindCSS with custom theme
- **SEO Optimized**: Sitemap, RSS, meta tags
- **Math Support**: KaTeX for mathematical equations
- **Contact Form**: Contact form functionality
- **Disqus Comments**: Enabled for blog posts

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean dist folder

## Content Management
- **Blog Posts**: Located in `src/content/posts/` as Markdown files
- **Post Categories**: Currently using "Mathematics" category
- **Content Schema**: Defined in `src/content/config.ts`
- **Images**: Stored in `public/images/`

## Site Configuration
Main config in `src/config/config.json`:
- Site title: "Wu Ganglin - Personal Website"
- Profile info and bio
- Pagination settings (6 posts per page)
- Disqus integration enabled
- Contact form action

## Custom Shortcodes Available
- `<Button>` - Custom button component
- `<Accordion>` - Collapsible content
- `<Notice>` - Alert/notice boxes
- `<Video>` - Video embed
- `<Youtube>` - YouTube embed
- `<Tabs>` & `<Tab>` - Tabbed content interface

## Build & Deployment
- **Output**: Static site generation
- **Image Optimization**: Squoosh image service
- **Base URL**: https://ganglin.net
- **Trailing Slash**: Disabled
- **Build Config**: Uses buildspec.yaml (likely for AWS CodeBuild)
- **Netlify**: netlify.toml present for Netlify deployment

## Author Profile
- **Name**: Ganglin Wu
- **Role**: Math Tutor & Aspiring Backend Engineer  
- **Bio**: "Hi there! I'm a full time Math Tutor who is really into lifelong learning."
- **Avatar**: /images/splash.png

## Notes for Future Development
- Site focuses on mathematics education content
- Uses clean, minimal design (Hydrogen theme)
- Built for performance (static generation)
- Ready for scaling with more blog content
- TypeScript enabled for type safety
- Modern React hooks and components