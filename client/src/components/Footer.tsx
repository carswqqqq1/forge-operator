import { useLocation } from "wouter";

export default function Footer() {
  const [, setLocation] = useLocation();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Pricing", href: "#pricing" },
        { label: "Web app", href: "/" },
        { label: "AI design", href: "#design" },
        { label: "AI slides", href: "#slides" },
        { label: "Browser operator", href: "#operator" },
        { label: "Research", href: "/research" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "#blog" },
        { label: "Docs", href: "#docs" },
        { label: "Updates", href: "#updates" },
        { label: "Help center", href: "#help" },
        { label: "Trust center", href: "#trust" },
        { label: "API", href: "#api" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Events", href: "#events" },
        { label: "Fellows", href: "#fellows" },
      ],
    },
    {
      title: "Compare",
      links: [
        { label: "VS ChatGPT", href: "#compare-chatgpt" },
        { label: "VS Lovable", href: "#compare-lovable" },
      ],
    },
    {
      title: "Download",
      links: [
        { label: "Mobile app", href: "#mobile" },
        { label: "Desktop app", href: "#desktop" },
        { label: "Browser", href: "#browser" },
      ],
    },
    {
      title: "Business",
      links: [
        { label: "Team plan", href: "#team" },
        { label: "SSO", href: "#sso" },
        { label: "API", href: "#api-business" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About us", href: "#about" },
        { label: "Careers", href: "#careers" },
        { label: "For business", href: "#business" },
        { label: "For media", href: "#media" },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t-2 border-dashed border-primary mt-16">
      <div className="container py-12">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-serif font-bold text-sm mb-4 text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-dashed border-primary pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Forge. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#cookies" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Manage cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
