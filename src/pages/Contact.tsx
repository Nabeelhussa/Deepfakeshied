import { useState } from "react";
import { z } from "zod";
import { Building2, Mail, MapPin, Send, Code2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

const Contact = () => {
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      subject: fd.get("subject"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast.error("Check your inputs", { description: parsed.error.issues[0].message });
      return;
    }
    setPending(true);
    // Frontend-only for now. Wire to an edge function + Resend when needed.
    await new Promise((r) => setTimeout(r, 700));
    setPending(false);
    e.currentTarget.reset();
    toast.success("Message sent", { description: "We'll get back to you within 2 business days." });
  };

  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch."
      description="Questions about deployment, research collaboration, or enterprise pilots — reach out and we'll respond personally."
    >
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-6">
          {[
            { icon: Mail, label: "Email", value: "team@deepfakeshield.app" },
            { icon: MapPin, label: "Campus", value: "Mirpur University of Science & Technology, Mirpur AJK" },
            { icon: Building2, label: "Department", value: "Bachelor of Science in Software Engineering" },
            { icon: Code2, label: "Source", value: "github.com/deepfake-shield" },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="mt-0.5 text-foreground">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-elevated">
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
              <Input id="name" name="name" maxLength={100} required className="mt-1.5 sm:mt-2" placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input id="email" name="email" type="email" maxLength={255} required className="mt-1.5 sm:mt-2" placeholder="jane@company.com" />
            </div>
          </div>
          <div className="mt-4 sm:mt-5">
            <Label htmlFor="subject" className="text-xs sm:text-sm">Subject</Label>
            <Input id="subject" name="subject" maxLength={150} required className="mt-1.5 sm:mt-2" placeholder="Enterprise pilot inquiry" />
          </div>
          <div className="mt-4 sm:mt-5">
            <Label htmlFor="message" className="text-xs sm:text-sm">Message</Label>
            <Textarea id="message" name="message" maxLength={2000} required rows={5} className="mt-1.5 sm:mt-2" placeholder="Tell us a bit about your use case…" />
          </div>
          <Button type="submit" size="lg" className="mt-6 shadow-glow w-full sm:w-auto justify-center" disabled={pending}>
            {pending ? "Sending…" : <>Send message <Send className="ml-1 h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </PageShell>
  );
};

export default Contact;
