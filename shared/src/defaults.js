export const CONFIG_VERSION = 1;

export const MESSAGE_KEYS = [
  "welcome",
  "classicPending",
  "claimed",
  "waiting",
  "preparing",
  "saving",
  "saved",
  "submitted",
  "support",
  "closed",
  "alreadyOpen",
  "question",
  "summary",
];

export const MESSAGE_META = {
  welcome: { label: "Classic welcome", group: "Classic tickets" },
  classicPending: { label: "Waiting for staff", group: "Classic tickets" },
  claimed: { label: "Ticket claimed", group: "Claim flow" },
  waiting: { label: "Waiting for claimer", group: "Claim flow" },
  preparing: { label: "Preparing ticket", group: "Question tickets" },
  saving: { label: "Saving answer", group: "Question tickets" },
  saved: { label: "Answer saved", group: "Question tickets" },
  submitted: { label: "Application submitted", group: "Question tickets" },
  support: { label: "Staff notification", group: "Staff" },
  closed: { label: "Ticket closed", group: "Utility" },
  alreadyOpen: { label: "Existing ticket", group: "Utility" },
  question: { label: "Question prompt", group: "Question tickets" },
  summary: { label: "Review / send", group: "Question tickets" },
};

export const ASSET_KEYS = [
  "pendulumGif",
  "spinnerGif",
  "preparingGif",
  "savingGif",
  "successGif",
];

export const ASSET_META = {
  pendulumGif: {
    label: "Pendulum",
    hint: "Shown while a classic ticket waits for a staff member.",
  },
  spinnerGif: {
    label: "Spinner",
    hint: "Shown after a ticket has been claimed, while the claimer works.",
  },
  preparingGif: {
    label: "Preparing",
    hint: "Shown for 5–10 seconds before the first question.",
  },
  savingGif: {
    label: "Saving",
    hint: "Shown for 1–3 seconds after every answer.",
  },
  successGif: {
    label: "Success",
    hint: "Shown after an answer has been saved.",
  },
};

export const DEFAULT_ASSETS = {
  pendulumGif: "https://media.tenor.com/ZDQm6tcyVooAAAAM/pendulum.gif",
  spinnerGif: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  preparingGif: "https://media.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif",
  savingGif: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  successGif: "https://media.giphy.com/media/bpv34afu6bbcFFIXtX/giphy.gif",
};

export const DEFAULT_MESSAGES = {
  welcome: {
    title: "Your ticket is open",
    description:
      "Hey {user}, thanks for opening a **{type}** ticket.\n\nTell us what you need below and a team member will take a look.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  classicPending: {
    title: "A team member is on the way",
    description:
      "Thanks, {user}. Your message has been received.\nPlease wait a moment while a team member takes a look at your ticket.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "Sit tight — you're in the queue.",
    color: "",
  },
  claimed: {
    title: "Ticket claimed",
    description:
      "{staff} has claimed your ticket and will be with you shortly.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  waiting: {
    title: "Waiting for {staffName}",
    description:
      "{staff} is reviewing your ticket. Please wait here — they'll reply as soon as they can.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  preparing: {
    title: "Preparing your ticket",
    description:
      "We're getting everything ready for you.\nThis usually takes just a few seconds.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  saving: {
    title: "Saving your answer",
    description: "Just a moment while we save your response.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  saved: {
    title: "Answer saved",
    description: "Got it — your answer has been saved.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  submitted: {
    title: "Application submitted",
    description:
      "Thanks, {user}. Your answers have been sent to the team.\nWe'll get back to you in this ticket.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  support: {
    title: "New {type} ticket",
    description:
      "**Opened by:** {user}\n**Ticket:** {ticket}\n**Request:** {firstMessage}\n\nClick **{claimLabel}** to take over this ticket.",
    imageUrl: "",
    thumbnailUrl: "{userAvatar}",
    footerText: "",
    color: "",
  },
  closed: {
    title: "Ticket closed",
    description: "This ticket has been closed. Thanks for reaching out.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  alreadyOpen: {
    title: "You already have a ticket open",
    description: "You already have an open **{type}** ticket: {ticket}",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "",
    color: "",
  },
  question: {
    title: "Question {number} of {total}",
    description: "{question}",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "Type your answer in this channel. Type `skip` to skip an optional question.",
    color: "",
  },
  summary: {
    title: "Review your answers",
    description:
      "Please check your answers below. Click **{sendLabel}** when everything looks good.",
    imageUrl: "",
    thumbnailUrl: "",
    footerText: "Only you can submit this application.",
    color: "",
  },
};

export const DEFAULT_LABELS = {
  claim: "Claim ticket",
  claimed: "Claimed",
  close: "Close ticket",
  confirmClose: "Confirm close",
  cancel: "Cancel",
  send: "Send answers",
  skip: "Skip",
  selectPlaceholder: "Select a ticket type",
};

export const DEFAULT_IDENTITY = {
  botName: "Ply",
  accentColor: "#7C5CFC",
  successColor: "#3BA55D",
  dangerColor: "#ED4245",
  footerText: "{botName} • Just apply, but customized.",
};

export const DEFAULT_PANEL = {
  channelId: "",
  title: "Just apply, but customized.",
  description:
    "Pick the ticket type that fits your request. We'll guide you from there.",
  imageUrl: "",
  thumbnailUrl: "",
  footerText: "",
  style: "auto",
};

export const DEFAULT_DEFAULTS = {
  categoryId: "",
  supportChannelId: "",
  ticketNameFormat: "ticket-{username}",
  answersNameFormat: "answers-{ticket}",
};

export const DEFAULT_TIMING = {
  prepMinSeconds: 5,
  prepMaxSeconds: 10,
  saveMinSeconds: 1,
  saveMaxSeconds: 3,
  claimedToSpinnerMs: 2500,
  nextQuestionMs: 900,
  closeDelaySeconds: 5,
};

export const DEFAULT_BEHAVIOR = {
  oneOpenPerType: true,
  allowUserClose: true,
  deleteOnClose: false,
  pingOwnerOnClaim: true,
  notifyStaff: false,
  maxAnswerLength: 1500,
};

export const DEFAULT_TICKET_TYPES = [
  {
    id: "general-support",
    name: "General Support",
    description: "Talk to our team about anything.",
    emoji: "🎫",
    mode: "classic",
    enabled: true,
    categoryId: "",
    supportChannelId: "",
    ticketNameFormat: "",
    answersNameFormat: "",
    staffRoleIds: [],
    adminRoleIds: [],
    questions: [],
    messageOverrides: {},
    assetOverrides: {},
    timingOverrides: {},
  },
  {
    id: "staff-application",
    name: "Staff Application",
    description: "Apply to join our team. We'll ask a few questions.",
    emoji: "📝",
    mode: "questions",
    enabled: true,
    categoryId: "",
    supportChannelId: "",
    ticketNameFormat: "",
    answersNameFormat: "",
    staffRoleIds: [],
    adminRoleIds: [],
    questions: [
      {
        id: "about-you",
        label: "About you",
        question: "What should we call you, and how old are you?",
        imageUrl: "",
        thumbnailUrl: "",
        required: true,
      },
      {
        id: "experience",
        label: "Experience",
        question:
          "Tell us about your experience in this community or in similar roles.",
        imageUrl: "",
        thumbnailUrl: "",
        required: true,
      },
      {
        id: "motivation",
        label: "Motivation",
        question: "Why do you want to join the team?",
        imageUrl: "",
        thumbnailUrl: "",
        required: true,
      },
      {
        id: "availability",
        label: "Availability",
        question:
          "How much time can you dedicate each week, and in which timezone?",
        imageUrl: "",
        thumbnailUrl: "",
        required: true,
      },
      {
        id: "scenario",
        label: "Scenario",
        question:
          "A member is upset about a punishment. How would you handle it?",
        imageUrl: "",
        thumbnailUrl: "",
        required: true,
      },
    ],
    messageOverrides: {},
    assetOverrides: {},
    timingOverrides: {},
  },
];

export function createDefaultConfig() {
  return {
    version: CONFIG_VERSION,
    identity: { ...DEFAULT_IDENTITY },
    panel: { ...DEFAULT_PANEL },
    permissions: {
      adminRoleIds: [],
      staffRoleIds: [],
    },
    defaults: { ...DEFAULT_DEFAULTS },
    timing: { ...DEFAULT_TIMING },
    behavior: { ...DEFAULT_BEHAVIOR },
    assets: { ...DEFAULT_ASSETS },
    labels: { ...DEFAULT_LABELS },
    messages: structuredClone(DEFAULT_MESSAGES),
    ticketTypes: structuredClone(DEFAULT_TICKET_TYPES),
  };
}

export const DEFAULT_CONFIG = createDefaultConfig();
