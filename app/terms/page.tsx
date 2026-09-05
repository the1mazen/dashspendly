"use client"

import Link from "next/link"
import { ArrowLeft, Download, FileText, Mail, ExternalLink, ShieldCheck } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#00042e] text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>

          <a
            href="/Spendly_Terms_and_Conditions.docx"
            download="Spendly_Terms_and_Conditions.docx"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download .docx</span>
          </a>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="h-12 w-12 rounded-2xl bg-[#5b4dc7]/20 border border-[#5b4dc7]/30 flex items-center justify-center text-[#9d93f7]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Terms and Conditions</h1>
              <p className="text-sm text-white/50">Last Updated: September 2025</p>
            </div>
          </div>

          <div className="space-y-6 text-sm sm:text-base text-white/80 leading-relaxed">
            <p className="bg-white/5 p-4 rounded-xl border border-white/5 text-white/90">
              These Terms and Conditions govern your use of the Spendly website and application (collectively, the &ldquo;Service&rdquo;). Please read them carefully before using Spendly.
            </p>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">1.</span> Acceptance of Terms
              </h2>
              <p>
                By accessing or using Spendly (&ldquo;the Service&rdquo;), you agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and anyone who accesses or uses the Service. By using Spendly, you represent that you are at least 13 years of age and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">2.</span> Description of Service
              </h2>
              <p>Spendly is a free, manual-entry personal finance tracking tool. It allows users to:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/70">
                <li>Add and manage multiple accounts (bank, cash, credit cards, savings)</li>
                <li>Log income, expenses, transfers, fees, and notes</li>
                <li>Plan bills, recurring income, and transfers</li>
                <li>Create spending categories with budgets and allowances</li>
                <li>Build structured budgets using weekly, monthly, or custom periods</li>
                <li>Track net worth, account balances, and financial health</li>
                <li>Manage held funds and personalize the experience</li>
              </ul>
              <p className="text-white/70 text-xs italic pt-1">
                Spendly does not connect to any bank or financial institution. All data is entered manually by the user. The Service does not provide financial advice, investment recommendations, or any form of regulated financial services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">3.</span> Free Service
              </h2>
              <p>
                Spendly is offered entirely free of charge. There are no subscription fees, trial periods, or premium tiers. All features available on the platform are accessible to all users at no cost.
              </p>
              <p>
                We reserve the right to introduce optional paid features in the future. If we do, existing free features will remain free, and any paid features will be clearly communicated in advance.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">4.</span> User Accounts and Data
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
              </p>
              <p>
                All financial data you enter into Spendly is your own. You may permanently reset or delete your data at any time through the settings. Upon deletion, your data is removed and cannot be recovered.
              </p>
              <p>
                You agree not to enter false, misleading, or fraudulent information into the Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">5.</span> Privacy and Data
              </h2>
              <p>
                Spendly does not connect to your bank accounts or any third-party financial institution. Your financial data is entered manually and is not shared with or sold to any third party.
              </p>
              <p>
                We take reasonable technical measures to protect your data. However, no system is completely secure. By using the Service, you acknowledge and accept this inherent risk.
              </p>
              <p>
                For full details on how we collect and handle data, please refer to our Privacy Policy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">6.</span> Acceptable Use
              </h2>
              <p>You agree to use Spendly only for lawful purposes and in a manner consistent with these Terms. You must not:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/70">
                <li>Use the Service for any unlawful, fraudulent, or malicious purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure</li>
                <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to store or transmit harmful, offensive, or illegal content</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">7.</span> Intellectual Property
              </h2>
              <p>
                The Spendly name, logo, design, and all content created by us are protected by intellectual property laws and remain the property of Spendly and its creator.
              </p>
              <p>
                You are granted a limited, non-exclusive, non-transferable license to access and use the Service for your personal, non-commercial purposes. You may not reproduce, distribute, or create derivative works based on the Service without prior written permission.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">8.</span> Disclaimer of Warranties
              </h2>
              <p>
                Spendly is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p>
                We do not guarantee that the Service will be uninterrupted, error-free, or completely secure. We are not responsible for any inaccuracies in the data you enter or calculations derived from it.
              </p>
              <p>
                Nothing in Spendly constitutes financial, legal, or professional advice. Decisions made based on information within the Service are made at your own risk.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">9.</span> Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by applicable law, Spendly and its creator shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
              </p>
              <p>
                This includes, but is not limited to, loss of data, financial loss, or any damages resulting from reliance on information provided by the Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">10.</span> Changes to the Service
              </h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will make reasonable efforts to notify users of significant changes.
              </p>
              <p>
                Continued use of the Service after changes are made constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">11.</span> Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time. When we do, we will revise the &ldquo;Last Updated&rdquo; date at the top of this document. We encourage you to review these Terms periodically.
              </p>
              <p>
                Your continued use of Spendly after any changes constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">12.</span> Termination
              </h2>
              <p>
                You may stop using Spendly at any time. You may also permanently delete your account and all associated data through the settings.
              </p>
              <p>
                We reserve the right to suspend or terminate your access to the Service at our discretion, including if we believe you have violated these Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">13.</span> Governing Law
              </h2>
              <p>
                These Terms are governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Service will be resolved in the appropriate jurisdiction.
              </p>
            </section>

            <section className="space-y-2 pb-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#5b4dc7]">14.</span> Contact
              </h2>
              <p>If you have any questions or concerns about these Terms, you can reach us at:</p>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-white/70">
                  <Mail className="w-4 h-4 text-[#5b4dc7]" />
                  <span>Email: </span>
                  <a href="mailto:reachmazen@gmail.com" className="text-white hover:underline">
                    reachmazen@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <ExternalLink className="w-4 h-4 text-[#5b4dc7]" />
                  <span>GitHub: </span>
                  <a
                    href="https://github.com/the1mazen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                  >
                    https://github.com/the1mazen
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5b4dc7]" />
              <span>Spendly Legal Documentation</span>
            </div>
            <span>&copy; {new Date().getFullYear()} Spendly</span>
          </div>
        </div>
      </div>
    </div>
  )
}
