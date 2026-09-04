export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export const legalSections: LegalSection[] = [
  {
    id: "controller",
    heading: "1. Name and Address of the Controller",
    paragraphs: [
      "The controller within the meaning of the General Data Protection Regulation (GDPR) and other data protection regulations is: Yellow White Noise, Berlin, Germany. Email: info@yellowwhitenoise.com (hereinafter \u201ccontroller\u201d or \u201cwe\u201d).",
      "For any question or suggestion regarding data protection, contact us at any time by email at privacy@yellowwhitenoise.com.",
    ],
  },
  {
    id: "general",
    heading: "2. General Information on Data Processing",
    paragraphs: [
      "Scope of processing. As a matter of principle, we process personal data only to the extent necessary to provide a functional website as well as our content and services. Otherwise, personal data is processed only with the user's consent, unless processing is permitted by other legal grounds.",
      "Legal basis. Where we obtain the consent of the data subject, Article 6(1)(a) GDPR serves as the legal basis. Where processing is necessary for the performance of a contract or pre-contractual measures, Article 6(1)(b) GDPR applies. Where processing is necessary to comply with a legal obligation, Article 6(1)(c) GDPR applies. Where processing is necessary to safeguard a legitimate interest of ours or of a third party that does not override the interests and rights of the data subject, Article 6(1)(f) GDPR applies.",
      "Erasure and retention. Personal data is erased or blocked as soon as the purpose of storage ceases to apply, unless European or national retention obligations require longer storage. Where data is retained for other legally permissible purposes, its processing is restricted: the data is blocked and not processed for other purposes.",
    ],
  },
  {
    id: "visiting",
    heading: "3. Collection of Data When Visiting Our Website",
    paragraphs: [
      "When you view our website, we or our hosting provider collect the data that is technically necessary to display the website to you and to ensure its stability and security: IP address; date and time of the request; time zone difference from Greenwich Mean Time; content of the request (specific page); access status / HTTP status code; volume of data transferred; the website from which the request originates; operating system and interface; language and version of the browser software.",
      "For this purpose we use the services of Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Further information on the purpose and scope of data collection by the provider: https://vercel.com/legal/privacy. The legal basis for the use of Vercel is Article 6(1)(f) GDPR; where consent has been obtained for cookies or device information, Article 6(1)(a) GDPR and \u00a7 25(1) TDDDG apply, and consent may be revoked at any time. We have concluded a data processing agreement with Vercel to ensure GDPR compliance: https://vercel.com/legal/dpa. As Vercel may use servers in the United States, the data transfer is based on the EU Commission's Standard Contractual Clauses.",
      "Log data is stored for a limited period and then deleted. It is not merged with other personal data of the user.",
    ],
  },
  {
    id: "cookies",
    heading: "4. Cookies and Consent",
    paragraphs: [
      "We keep non-essential cookies and tracking technologies strictly opt-in. On your first visit a consent banner lets you accept or decline advertising measurement. Your choice is stored in your browser's local storage under the key \u201cywn-cookie-consent\u201d so that we do not have to ask again; this entry contains no personal data beyond the choice itself and never leaves your device.",
      "During your visit we also store campaign parameters (for example utm_source, utm_medium, utm_campaign or gclid) in your browser's session storage. They exist only so that a streaming platform can attribute your click to the campaign that brought you here, and they disappear when your browsing session ends. Essential storage is limited to these functional entries.",
      "If you decline, no advertising or measurement technologies are loaded at any point.",
    ],
  },
  {
    id: "advertising",
    heading: "5. Advertising and Measurement (Meta Pixel, Google Ads)",
    paragraphs: [
      "Only with your consent do we load the Meta Pixel (Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Ireland) and Google Ads (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland). These tools place cookies or read device information in order to measure whether our advertising leads to clicks on our streaming links, and to build audiences for future campaigns.",
      "When you activate an outbound platform link, we fire a conversion event \u2014 \u201cPlatformOutbound\u201d to Meta and \u201cplatform_outbound\u201d to Google \u2014 together with the name of the platform and the entity involved (playlist, track or album). No names, email addresses or message content are transmitted; only pseudonymised identifiers that Meta and Google may link to their own profiles of you.",
      "Meta and Google may process this data in the United States. Transfers rest on the EU Data Privacy Framework and/or the EU Commission's Standard Contractual Clauses. Risks cannot be fully excluded, in particular with regard to access by US authorities.",
      "If you declined consent, neither tool is loaded and no conversion events are fired. You can withdraw consent at any time by clearing your browser storage for this website and refreshing the page. Meta's privacy policy: https://www.facebook.com/privacy/policy. Google's privacy policy: https://policies.google.com/privacy. Opt-outs: https://www.facebook.com/settings?tab=ads and https://adssettings.google.com.",
    ],
  },
  {
    id: "streaming",
    heading: "6. Outbound Links to Streaming Platforms",
    paragraphs: [
      "Our pages link to Spotify, Apple Music and YouTube Music. These are plain links, not embeds: while you only view our pages, no data is shared with these platforms.",
      "When you activate a link, your browser connects directly to the platform. The platform receives your IP address, the time of your click and \u2014 where a campaign is active \u2014 the campaign parameters described in section 4. If you are logged into the platform, it may associate the visit with your account. We have no influence on that processing.",
      "The legal basis is Article 6(1)(f) GDPR. The platforms' privacy policies: Spotify (Spotify AB, Stockholm, Sweden) https://open.spotify.com/legal/privacy-policy; Apple Music (Apple Distribution International Ltd., Cork, Ireland) https://www.apple.com/legal/privacy; YouTube Music (Google Ireland Limited, Dublin, Ireland) https://policies.google.com/privacy.",
    ],
  },
  {
    id: "email",
    heading: "7. Email Contact",
    paragraphs: [
      "You can contact us via the email addresses provided on this website. Personal data transmitted with your email is stored, used exclusively to handle your request, and is never passed to third parties.",
      "The legal basis is Article 6(1)(a) GDPR where you have given consent, otherwise Article 6(1)(f) GDPR; where your email aims at concluding a contract, Article 6(1)(b) GDPR also applies. Processing on contact by email is additionally based on our legitimate interest in handling the matter raised.",
      "Data is deleted as soon as it is no longer necessary for the purpose of its collection \u2014 for email data, once the conversation with you has conclusively ended.",
      "You may withdraw consent or object to the storage of your data at any time. In that case the conversation cannot be continued, and all personal data stored in the course of the contact is deleted.",
    ],
  },
  {
    id: "business",
    heading: "8. Bookings and Business Relationships",
    paragraphs: [
      "We process contact and business data of artists, partners, service providers and customers (in particular contact details and matter-related data) under Article 6(1)(b) GDPR in order to provide contractual or pre-contractual services, unless we point out other uses. The scope, nature and duration of the processing follow the purpose of the respective contractual relationship.",
      "Data is disclosed to third parties only where necessary for the fulfilment of our contractual obligations or where we are legally obliged to do so, for example by authorities.",
      "Unless otherwise agreed, data is deleted once storage is no longer necessary \u2014 generally after the expiry of contractual or legal claims \u2014 or processing is restricted where statutory retention duties apply. To prevent unauthorised access to your personal data, our website is encrypted using TLS.",
    ],
  },
  {
    id: "rights",
    heading: "9. Rights of the Data Subject",
    paragraphs: [
      "If your personal data is processed, you are a data subject within the meaning of the GDPR and you hold the following rights vis-\u00e0-vis the controller.",
      "Right of access (Art. 15 GDPR). You may request confirmation of whether we process personal data concerning you, and where we do, information about the purposes of processing, the categories of data, the recipients or categories of recipients, the planned storage period or the criteria for determining it, the existence of rights to rectification, erasure, restriction or objection, the right to lodge a complaint with a supervisory authority, the origin of the data where it was not collected from you, the existence of automated decision-making including profiling and \u2014 in such cases \u2014 meaningful information about the logic involved and the intended consequences, as well as whether data is transferred to a third country and the appropriate safeguards in place.",
      "Right to rectification (Art. 16 GDPR). You may request the correction of inaccurate personal data and the completion of incomplete data without undue delay.",
      "Right to restriction of processing (Art. 18 GDPR). You may request restriction while the accuracy of your data is being verified, where processing is unlawful but you oppose erasure and request restriction instead, where we no longer need the data but you require it to assert, exercise or defend legal claims, or where you have objected to processing and it is not yet decided whether our legitimate grounds override yours. Restricted data may, apart from storage, only be processed with your consent or for the establishment, exercise or defence of legal claims, or to protect the rights of another person or an important public interest.",
      "Right to erasure (Art. 17 GDPR). You may request the immediate erasure of your personal data where it is no longer necessary for the purposes for which it was collected, where you withdraw consent and no other legal basis exists, where you successfully object to processing, where the data was unlawfully processed, where erasure is required to comply with a legal obligation, or where the data was collected in relation to information society services. The right does not apply where processing is necessary for the exercise of freedom of expression and information, for compliance with a legal obligation, for reasons of public health, for archiving, research or statistical purposes in the public interest, or for the establishment, exercise or defence of legal claims.",
      "Right to be informed (Art. 19 GDPR). Where you have exercised your right to rectification, erasure or restriction, we inform all recipients to whom your data was disclosed of that rectification, erasure or restriction, unless this proves impossible or involves disproportionate effort.",
      "Right to data portability (Art. 20 GDPR). You may receive the personal data you provided to us in a structured, commonly used and machine-readable format and have it transmitted to another controller without hindrance from us, provided the processing is based on consent or a contract and is carried out by automated means, and provided this is technically feasible and does not adversely affect the freedoms and rights of others.",
      "Right to object (Art. 21 GDPR). You may object at any time, on grounds relating to your particular situation, to processing based on Articles 6(1)(e) or (f) GDPR, including profiling. We will then no longer process your data unless we can demonstrate compelling legitimate grounds that override your interests, rights and freedoms, or the processing serves the assertion, exercise or defence of legal claims. Where personal data is processed for direct marketing, you have an absolute right to object, and the data will no longer be processed for that purpose.",
      "Right to withdraw consent (Art. 7(3) GDPR). You may withdraw your consent at any time. Withdrawal does not affect the lawfulness of processing carried out on the basis of consent before its withdrawal.",
      "Automated decision-making (Art. 22 GDPR). You have the right not to be subject to a decision based solely on automated processing, including profiling, that produces legal effects or similarly significantly affects you, unless the decision is necessary for the conclusion or performance of a contract, is authorised by law with appropriate safeguards, or is based on your explicit consent. We do not carry out such decision-making.",
      "Right to lodge a complaint (Art. 77 GDPR). Without prejudice to any other remedy, you may lodge a complaint with a supervisory authority, in particular in the member state of your habitual residence, workplace or the place of the alleged infringement, if you consider that the processing of your personal data infringes the GDPR.",
      "To exercise any of these rights, email privacy@yellowwhitenoise.com.",
    ],
  },
  {
    id: "validity",
    heading: "10. Validity and Amendments to This Privacy Policy",
    paragraphs: [
      "This privacy policy is effective as of August 2026. Due to the further development of our website and its services, or due to changed legal or regulatory requirements, it may become necessary to amend this privacy policy. The current version is available at any time on this page under \u201cPrivacy & Legal\u201d.",
    ],
  },
];
