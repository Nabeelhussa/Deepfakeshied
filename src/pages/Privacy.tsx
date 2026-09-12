import { PageShell } from "@/components/PageShell";

const Privacy = () => {
  return (
    <PageShell
      eyebrow="Privacy Policy"
      title="Your data stays on your device."
      description="We believe in privacy by design. Deepfake Shield is built to process all sensitive media entirely on your local hardware."
    >
      <div className="prose prose-slate dark:prose-invert max-w-3xl mt-8">
        <section className="mb-12">
          <h2 className="text-2xl font-display mb-4">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Deepfake Shield. We are committed to protecting your personal information and your right to privacy. 
            Because our core service involves analyzing highly sensitive biometric data (your face, voice, and pulse), we designed our architecture so that we <strong>do not have access to your data in the first place</strong>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-display mb-4">2. Zero Data Upload Policy</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our live detector runs entirely within your web browser using WebAssembly and WebGL. When you use your camera, share your screen, or upload a video file for analysis:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>No Video is Uploaded:</strong> Media streams are processed frame-by-frame in your device's active memory (RAM).</li>
            <li><strong>No Biometrics are Stored:</strong> Face landmarks, rPPG pulse signals, and blendshapes are analyzed on-the-fly and immediately discarded.</li>
            <li><strong>Zero Telemetry:</strong> We do not track your usage patterns, detection results, or trust scores.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-display mb-4">3. What Information We Do Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            While the detection engine is completely private, we do collect minimal information necessary to run our website and business:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Local Storage:</strong> We save your UI preferences (like Dark Mode and alert thresholds) locally in your browser.</li>
            <li><strong>Subscription Data:</strong> If you upgrade to a paid tier, payment information is collected securely by our payment processors (e.g., Stripe) or handled via manual invoices (EasyPaisa/JazzCash). We do not store your raw credit card numbers.</li>
            <li><strong>Contact Information:</strong> If you email us for support, we retain that correspondence to assist you.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-display mb-4">4. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use trusted third-party providers for hosting and payments. These providers may collect standard web analytics (like IP addresses and browser types) to ensure network security and prevent DDoS attacks. They are bound by strict data processing agreements and cannot access your camera or detection data.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-display mb-4">5. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            Deepfake Shield was developed at Mirpur University of Science and Technology. If you have questions or comments about this notice, you may email us at:
          </p>
          <p className="text-primary font-medium mt-4">
            support@deepfakeshield.com
          </p>
        </section>
        
        <div className="text-sm text-muted-foreground pt-8 border-t border-border/40 mt-16">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </PageShell>
  );
};

export default Privacy;
