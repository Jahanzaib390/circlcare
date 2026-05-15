# CirclCare AI

## Hackathon Project Documentation

CirclCare AI is a multilingual, agent-assisted mobile platform for coordinating informal elder-care services across families, caregivers, drivers, nurses, physiotherapists, pharmacy runners, clinic helpers, home attendants, and trusted local providers.

The product is not a generic service marketplace and not a single-domain physiotherapy app. It is a trust-aware coordination layer for families who currently manage elder-care needs through WhatsApp groups, phone calls, referrals, and repeated manual follow-up.

The system turns noisy natural-language requests into structured service plans, matches the right local provider using explainable rules, generates transparent quotes, schedules the job, simulates live progress, captures proof of completion, updates reputation, and handles disputes or fallback scenarios.

## Core Idea

Families often need more than one service when caring for elderly parents or relatives:

- A wheelchair-friendly ride to a clinic
- A reliable helper to accompany an elder during an appointment
- A female nurse for home care
- A physiotherapist who speaks the patient's language
- Medicine pickup after consultation
- A lab sample collection visit
- A recurring caregiver for a few hours daily
- A trusted meal provider for diabetic or low-salt food
- A fallback provider when the original helper cancels

Today, these tasks are coordinated manually through informal networks. The result is missed follow-ups, weak trust, unclear pricing, poor accountability, and high stress for families.

CirclCare AI solves this by acting as an intelligent coordination system for informal elder-care services.

## Product Positioning

### One-line Pitch

CirclCare AI is a multilingual life-admin agent for elder-care services that matches families with trusted local providers using safety, preferences, language, availability, reliability, and transparent pricing.

### What Makes It Different

Most teams may build a simple technician booking app for plumbers, AC technicians, or electricians. CirclCare AI focuses on higher-trust, higher-context informal services where matching quality matters more than distance.

The product differentiates through:

- Multi-service elder-care workflows
- Preference-aware matching
- Gender, language, home-visit, and safety constraints
- Family approval and status updates
- Transparent quote breakdowns
- Proof-based service completion
- Dispute and escalation workflows
- Provider workload balancing
- Robust fallback when providers cancel or no suitable match exists

## Supported Service Categories

CirclCare AI supports a variety of elder-care and family support services.

### Health and Care Services

- Home physiotherapy
- Female physiotherapist visit
- Nurse visit
- Elder caregiver
- Post-surgery care assistant
- Blood pressure / sugar check visit
- Lab sample collection
- Injection / dressing visit
- Medicine reminder assistant
- Home attendant for a few hours

### Mobility and Appointment Support

- Clinic pickup and drop-off
- Wheelchair-friendly car
- Hospital appointment companion
- Pharmacy stop after consultation
- Lab visit assistant
- Document carrying / report collection
- Return-home coordination

### Medicine and Errands

- Medicine pickup
- Prescription refill
- Lab report pickup
- Grocery pickup for elderly household
- Medical equipment delivery
- Document submission

### Food and Daily Support

- Diabetic meal provider
- Low-salt meal provider
- Homemade tiffin
- Soft-food meal plan
- Weekly elder meal subscription
- Emergency meal delivery

### Home Safety and Comfort

- Elder-safe bathroom fixture installation
- Bed rail setup
- Wheelchair ramp arrangement
- Room cleaning helper
- Laundry pickup
- Basic home comfort maintenance

### Recurring Care Plans

- Daily caregiver
- Weekly physiotherapy
- Monthly medicine refill
- Recurring clinic transport
- Weekly meal subscription
- Family check-in visit

This variety keeps the product aligned with the informal service economy challenge while avoiding the overused repair-technician direction.

## Example User Requests

The app should support Urdu, Roman Urdu, English, and code-switched input.

```text
Ammi ko kal 11 baje clinic le jana hai, wheelchair friendly car chahiye aur wapis medicine bhi pick karni hai.
```

```text
Meri nani ke liye roz 2 ghantay caregiver chahiye, female ho aur Punjabi bol leti ho.
```

```text
Abu ki knee surgery ke baad ghar pe physio chahiye, DHA mein, evening slot ho to better.
```

```text
Diabetic patient ke liye low sugar ghar ka khana chahiye, weekly plan bata dein.
```

```text
Kal blood sample collection chahiye ghar se, patient elderly hai aur morning mein fasting sample hai.
```

```text
Hospital se reports collect karwani hain aur ghar deliver karni hain, urgent hai.
```

## Main App Flow

### 1. Request Capture

The user enters a natural-language request through text or voice.

The app supports noisy and mixed language input such as Roman Urdu, Urdu, English, and misspellings.

Example:

```text
Ammi ko kal clinic le jana hai, wheelchair car chahiye, female helper ho to acha hai, wapis medicine bhi leni hai.
```

### 2. Intent and Entity Extraction

Gemini extracts structured information:

```json
{
  "service_bundle": ["clinic_transport", "appointment_companion", "medicine_pickup"],
  "patient": "mother",
  "location_from": "home",
  "location_to": "clinic",
  "time_preference": "tomorrow",
  "mobility_needs": ["wheelchair_friendly_vehicle"],
  "provider_preferences": {
    "gender": "female_preferred",
    "language": [],
    "verified_only": true
  },
  "urgency": "medium",
  "risk_level": "high",
  "clarification_needed": true,
  "clarification_question": "What is the clinic location and preferred appointment time?"
}
```

### 3. Confirmation

The app shows the interpreted request and asks for confirmation if confidence is low or details are missing.

Example confirmation screen:

```text
I understood this as:

Need:
Clinic transport + helper + medicine pickup

For:
Elderly mother

Requirements:
Wheelchair-friendly vehicle
Female helper preferred
Verified provider required

Missing:
Clinic location
Appointment time
```

### 4. Provider Matching

The backend performs deterministic filtering and ranking.

Gemini is used for language understanding and human-readable explanations, while the app logic controls actual matching decisions.

### 5. Transparent Quote

The app generates a quote with breakdown:

```text
Clinic ride                Rs. 1,800
Wheelchair assistance      Rs. 500
Appointment waiting time   Rs. 700
Medicine pickup stop       Rs. 300
Urgency adjustment         Rs. 250

Estimated total            Rs. 3,550
```

### 6. Booking Simulation

The system simulates:

- Provider assignment
- Calendar reservation
- Family notification
- Reminder
- Live status updates
- Service progress
- Completion checklist
- Receipt

### 7. Service Quality Loop

After completion, the app collects:

- Customer confirmation
- Provider checklist
- Photo or receipt placeholder
- Rating
- Complaint reason if any
- Reputation update

### 8. Dispute and Escalation

The system handles:

- Provider no-show
- Late arrival
- Extra charge disagreement
- Medicine pickup missed
- Patient safety concern
- Poor service quality
- Refund or revisit recommendation
- Human escalation simulation

## Matching Philosophy

CirclCare AI uses trust-aware matching rather than distance-only matching.

For sensitive elder-care jobs, the closest provider is not always the best provider. The system considers safety, reliability, specialization, language, gender preference, home-visit comfort, and recent behavior.

## Matching Pipeline

### Stage 1: Hard Filters

Hard filters remove providers who cannot safely or properly fulfill the request.

Examples:

- Service type must match
- Provider must serve the area
- Provider must be available
- Home visit must be supported if requested
- Female provider must be selected when explicitly required
- Required language must match if user marks it critical
- Verified provider required for high-risk services
- Wheelchair-friendly support required when requested

### Stage 2: Scoring

Remaining providers are ranked using weighted scoring.

Example scoring factors:

```text
Specialization match       20%
Availability fit           15%
Reliability / on-time      15%
Language match             10%
Gender / comfort fit       10%
Rating and review recency  10%
Cancellation risk          10%
Distance / travel time      5%
Price fit                   5%
```

Weights change by service type. For example, gender, verification, and reliability receive higher weight for nursing, caregiving, babysitting, and home physiotherapy.

## Example Matching Decision

User request:

```text
Meri nani ke liye female caregiver chahiye, roz 2 ghantay, Punjabi bolti ho, Model Town mein.
```

Provider A:

```text
Female caregiver
Speaks Punjabi
Serves Model Town
Verified
On-time score: 94%
Cancellation rate: 3%
Experience: elder care
```

Provider B:

```text
Male caregiver
Higher rating
Lower price
Serves Model Town
Does not match gender preference
```

Decision:

Provider B is rejected despite good rating and lower price because the user explicitly requested a female caregiver. Provider A is selected due to stronger comfort and safety fit.

## Mock Data Plan

The prototype will use realistic synthetic data.

### Provider Schema

```json
{
  "id": "care_001",
  "name": "Sana Care Services",
  "provider_type": "individual",
  "gender": "female",
  "services": ["caregiver", "elder_companion", "medicine_pickup"],
  "specializations": ["elder care", "post-surgery support", "female patient support"],
  "languages": ["Urdu", "Punjabi", "English"],
  "areas": ["DHA", "Model Town", "Gulberg"],
  "home_visit": true,
  "verified": true,
  "family_friendly": true,
  "wheelchair_support": false,
  "rating": 4.8,
  "review_count": 88,
  "recent_review_score": 4.7,
  "on_time_score": 0.94,
  "cancellation_rate": 0.03,
  "base_rate": 1800,
  "hourly_rate": 900,
  "experience_years": 5,
  "capacity_per_day": 4,
  "availability": [
    {
      "date": "2026-05-16",
      "slots": ["10:00", "13:00", "17:00"]
    }
  ],
  "risk_flags": [],
  "past_disputes": 1
}
```

### Service Schema

```json
{
  "service_id": "clinic_visit_bundle",
  "name": "Clinic Visit Assistance",
  "category": "mobility_and_appointment_support",
  "complexity": "intermediate",
  "requires_verification": true,
  "supports_recurring": false,
  "base_price": 1800,
  "pricing_factors": [
    "distance",
    "waiting_time",
    "wheelchair_support",
    "medicine_pickup_stop",
    "urgency",
    "time_of_day"
  ]
}
```

### Booking Schema

```json
{
  "booking_id": "book_001",
  "user_id": "user_001",
  "provider_id": "care_001",
  "service_bundle": ["clinic_transport", "appointment_companion", "medicine_pickup"],
  "scheduled_start": "2026-05-16T10:30:00",
  "status": "confirmed",
  "quoted_price": 3550,
  "risk_level": "high",
  "family_notified": true,
  "timeline": [
    "request_confirmed",
    "provider_assigned",
    "reminder_sent"
  ]
}
```

## LLM Usage

The prototype will use Gemini through the Google AI Studio Gemini API for rapid development.

Gemini will be used for:

- Multilingual and Roman Urdu understanding
- Noisy input cleanup
- Structured entity extraction
- Confidence scoring
- Clarification questions
- Human-readable provider explanation
- Dispute summarization
- Notification text generation

Gemini will not be the only decision-maker. The backend will enforce deterministic logic for:

- Hard filters
- Provider scoring
- Scheduling conflicts
- Pricing
- Booking state
- Cancellation fallback
- Reputation updates

This makes the system explainable, testable, and safer.

## LLM Provider Abstraction

The app should use a simple provider interface so the model source can change later without rewriting the app.

```text
LLMProvider
  parseRequest(input)
  generateClarification(parsedRequest)
  explainMatch(request, provider, score)
  summarizeDispute(dispute)
```

Initial implementation:

```text
Google AI Studio Gemini API
```

Production migration:

```text
Vertex AI Gemini API
```

## Architecture

```text
Mobile App
  |
  v
Backend API
  |
  +-- LLM Provider Layer
  |     |
  |     +-- Gemini API
  |
  +-- Matching Engine
  |
  +-- Pricing Engine
  |
  +-- Scheduling Engine
  |
  +-- Booking Simulator
  |
  +-- Dispute Engine
  |
  v
Mock Database
```

Suggested implementation:

```text
Frontend:
Expo / React Native

Backend:
Node.js / Express or FastAPI

Data:
JSON files first, then Firebase / Supabase if time permits

LLM:
Gemini API from Google AI Studio
```

## Mobile App Screens

### 1. Home / Request Screen

The first screen should be a direct service request interface, not a marketing page.

Main elements:

- Text input
- Voice input placeholder
- Category shortcuts
- Recent requests
- Emergency or high-priority toggle

Categories:

- Clinic visit
- Home nurse
- Caregiver
- Physiotherapy
- Medicine pickup
- Lab sample
- Meal plan
- Daily support

### Location and Maps

The app should support maps and distance-aware matching, but the prototype should not depend on production-grade live maps to work.

The location system has three levels.

#### Level 1: Mock Coordinates for Demo

For the hackathon prototype, providers will have realistic mock coordinates, service areas, and service radius values.

Example user location:

```json
{
  "area": "DHA Phase 5",
  "city": "Lahore",
  "lat": 31.4697,
  "lng": 74.4126
}
```

Example provider location:

```json
{
  "id": "nurse_001",
  "name": "Sana Home Nursing",
  "base_location": {
    "area": "Gulberg",
    "city": "Lahore",
    "lat": 31.5204,
    "lng": 74.3587
  },
  "current_location": {
    "lat": 31.5010,
    "lng": 74.3850
  },
  "service_radius_km": 12,
  "serves_areas": ["DHA", "Gulberg", "Model Town"],
  "current_status": "available"
}
```

The backend can calculate straight-line distance using the Haversine formula and estimate travel time using a simple multiplier.

Example:

```text
distance_km = haversine(user_location, provider_location)
travel_time_minutes = distance_km * 3.5 + traffic_buffer
elder_care_buffer = 15 minutes
```

This allows the app to show:

```text
Provider distance: 6.8 km
Estimated travel time: 24 minutes
Care buffer: 15 minutes
Suggested arrival buffer: 39 minutes
```

#### Level 2: User Location Capture

The mobile app should support multiple ways to identify the user's location:

- Device GPS permission
- Manual location entry
- Area selection
- Saved home address
- Map pin selection
- Clarification question when location is ambiguous

Example flow:

```text
User enters:
"Ammi ke liye nurse chahiye kal sham DHA mein"

System asks:
"Should I use DHA Phase 5, Lahore as the service location?"
```

The app should never rely only on GPS. Many users will naturally type locations like:

```text
DHA Phase 5
G-13 Islamabad
Model Town near Bank Square
Gulberg main market ke paas
```

#### Level 3: Production Google Maps Integration

The prototype can use mock coordinates, but the production architecture can integrate:

- Google Maps SDK for map display
- Google Places API for address autocomplete
- Google Routes API or Distance Matrix API for route-aware ETA
- Provider mobile app location sharing
- Last-known provider location

The current matching engine should be designed so mock distance can later be replaced by real route duration without rewriting provider ranking logic.

#### Location-Aware Matching Rules

For location-sensitive services, the system applies hard filters first:

```text
Provider must serve requested city/area
Provider must be within service radius
Provider must support home visit if required
Provider must have enough travel buffer before the booking
```

Then distance and travel time are included in ranking:

```text
distance_score
travel_time_score
availability_fit
reliability_score
preference_match
```

Example explanation:

```text
Sana Home Nursing was selected even though another nurse is slightly closer because Sana matches the requested female provider preference, speaks Punjabi, has elder-care experience, and has a lower cancellation rate.
```

### Voice-to-Text Input

The app should support voice input because many users in the informal service economy will naturally speak requests in Urdu, Roman Urdu, English, or mixed language instead of typing them.

Voice should be treated as an input method, not as the main reasoning layer.

Recommended prototype flow:

```text
User taps microphone
  |
  v
Speech recognition converts voice to text
  |
  v
Text appears in request box
  |
  v
User can edit or confirm
  |
  v
Gemini parses the text into structured service request JSON
```

Example:

```text
Spoken:
"Ammi ko kal clinic le jana hai aur wapis medicine bhi leni hai"

Transcribed:
"Ammi ko kal clinic le jana hai aur wapis medicine bhi leni hai"

Parsed:
Clinic transport + appointment support + medicine pickup
```

For the Expo / React Native prototype, the first implementation can use:

```text
@react-native-voice/voice
```

Expected UI states:

- Idle
- Listening
- Transcribing
- Transcript ready
- Transcript failed
- Manual edit

The request screen should always allow typed input as a fallback.

Example UI:

```text
What do you need handled?

[ microphone button ]

Listening...
"Meri nani ke liye female caregiver chahiye..."

[ Stop ] [ Use Text ] [ Edit ]
```

#### Voice Quality Strategy

The app separates speech transcription from language understanding:

```text
Speech-to-text:
Converts audio into text

Gemini:
Understands the transcribed Roman Urdu / Urdu / English text
```

For the hackathon prototype:

```text
Device speech recognition is acceptable for voice-to-text.
Gemini is then used to interpret the transcript.
```

For production or a stronger version:

```text
Audio can be sent to a cloud transcription model or Google speech service.
The transcribed text can still be passed to Gemini for structured extraction.
```

Fallback behavior:

```text
If voice recognition fails or confidence is low, the app shows the partial transcript and asks the user to edit or type manually.
```

### 2. Understanding Screen

Shows what the system extracted.

Elements:

- Service bundle
- Patient context
- Time
- Location
- Preferences
- Risk level
- Confidence score
- Clarification question if needed

### 3. Match Results Screen

Shows ranked providers.

Elements:

- Recommended provider
- Alternative providers
- Why selected
- Why others were rejected
- Trust factors
- Availability
- Price estimate

### 4. Quote Screen

Shows transparent pricing.

Elements:

- Base price
- Add-ons
- Distance
- Waiting time
- Urgency
- Discount
- Total estimate
- Cheaper alternate slot if available

### 5. Booking Timeline Screen

Shows job lifecycle.

Timeline:

- Request confirmed
- Provider assigned
- Family notified
- Provider en route
- Patient picked up / visit started
- Task completed
- Proof uploaded
- Feedback collected

### 6. Live Status Screen

Shows simulation updates.

Examples:

- Provider is en route
- Patient picked up
- Reached clinic
- Waiting
- Medicine picked up
- Returned home

### 7. Feedback and Dispute Screen

Allows:

- Rating
- Service confirmation
- Complaint reason
- Extra charge dispute
- Refund / revisit / escalation recommendation

### 8. Provider View

Shows provider-side optimization.

Elements:

- Today jobs
- Suggested route
- Earnings estimate
- Cancellation warning
- Recommended slots
- Workload balancing

## Demo Scenarios

The final demo should show more than one service type to prove the platform is broad.

### Scenario A: Clinic Visit Bundle

Request:

```text
Ammi ko kal 11 baje clinic le jana hai, wheelchair friendly car chahiye aur wapis medicine bhi pick karni hai.
```

Workflow:

- Extract clinic transport, wheelchair support, medicine pickup
- Ask for clinic location if missing
- Rank verified providers
- Generate bundled quote
- Book provider
- Simulate live updates
- Complete with medicine receipt placeholder

### Scenario B: Recurring Caregiver

Request:

```text
Meri nani ke liye roz 2 ghantay female caregiver chahiye, Punjabi bolti ho, Model Town mein.
```

Workflow:

- Extract recurring schedule
- Enforce female provider preference
- Match Punjabi-speaking caregiver
- Show weekly price
- Book recurring plan
- Update provider capacity

### Scenario C: Home Physiotherapy

Request:

```text
Abu ki knee surgery ke baad ghar pe physio chahiye, evening mein, Urdu speaking ho.
```

Workflow:

- Classify complexity as intermediate or complex
- Match post-surgery rehab specialization
- Show why generic physio was rejected
- Book evening slot
- Capture feedback after visit

### Scenario D: Food and Medicine Support

Request:

```text
Diabetic patient ke liye low sugar ghar ka khana chahiye aur weekly medicine refill bhi.
```

Workflow:

- Split into meal subscription and medicine refill
- Match diabetic meal provider
- Match pharmacy runner
- Generate weekly plan
- Show recurring schedule

### Scenario E: Failure and Fallback

Event:

```text
Provider cancels 40 minutes before clinic pickup.
```

System response:

- Detect cancellation risk
- Re-rank available providers
- Preserve wheelchair requirement
- Notify family
- Suggest replacement with 20-minute delay
- Apply compensation discount

## Dynamic Pricing

Pricing should be transparent and explainable.

Example formula:

```text
total =
  base_service_price
  + distance_fee
  + waiting_time_fee
  + complexity_fee
  + urgency_fee
  + add_on_fees
  - loyalty_discount
```

Pricing factors:

- Service category
- Complexity
- Distance
- Time of day
- Urgency
- Provider base rate
- Add-ons such as wheelchair support or medicine pickup
- Recurring plan discount

## Robustness Features

The app should demonstrate at least these edge cases:

- Ambiguous request
- Missing location
- No matching female provider available
- Provider cancellation
- Overlapping booking
- User disputes extra charge
- Gemini parse confidence below threshold
- API failure fallback to manual category form

## Safety and Fairness

The system supports comfort and safety preferences without enabling harmful discrimination.

Supported preferences:

- Female provider
- Male provider
- Urdu-speaking
- Punjabi-speaking
- Pashto-speaking
- Sindhi-speaking
- English-speaking
- Verified provider
- Family-friendly
- Elder-care experience
- Home-visit comfort
- Wheelchair support

Avoid:

- Caste-based matching
- Sect-based matching
- Ethnic exclusion
- Religion-based exclusion

The product should describe these as comfort, safety, language, and care-context preferences.

## Scalability Plan

The prototype can be built quickly with AI Studio Gemini API and mock data, but the architecture should be production-ready in shape.

### Prototype

```text
Expo mobile app
Backend API
Gemini API from AI Studio
Mock provider JSON
In-memory booking simulation
Local matching engine
```

### Production

```text
React Native production app
Cloud Run backend
Vertex AI Gemini API
Firestore or PostgreSQL
Cloud Tasks for reminders
Pub/Sub for booking events
Google Maps / Places for travel time
Firebase Auth
Firebase Cloud Messaging
Observability and audit logs
```

The app should be designed so AI Studio can later be replaced with Vertex AI through the LLM provider abstraction.

## Build Ambition

The goal is not to make a minimal prototype. The goal is to build a polished, judge-ready product that feels larger than a one-week build.

AI-assisted development should be used to accelerate:

- UI generation
- Data model creation
- Mock dataset generation
- Backend endpoint scaffolding
- Matching algorithm implementation
- Pricing logic
- Demo scenario scripting
- README and technical documentation
- Test cases and edge-case simulation

The winning version should feel like a real product slice:

- Broad service coverage
- One excellent end-to-end primary flow
- Two or three additional supported flows
- Strong fallback scenario
- Clear logs from AI-assisted development
- Polished mobile UI
- Explainable matching and pricing

## Judging Alignment

### Working Prototype

Mobile app with end-to-end elder-care service orchestration.

### Multilingual Robustness

Roman Urdu, Urdu, English, and mixed-language request parsing.

### Matching Quality

Preference-aware, safety-aware, reliability-aware provider ranking.

### Scheduling and Pricing

Availability checks, travel buffers, recurring schedules, and transparent quote breakdowns.

### Service Lifecycle

Booking, notifications, live progress, completion proof, feedback, and reputation updates.

### Dispute Handling

No-show, late arrival, extra charge, incomplete service, and refund/revisit recommendation.

### Innovation and UX

Distinct elder-care service coordination domain instead of common repair-service marketplace.

### Scalability

Clear path from AI Studio prototype to Vertex AI, Cloud Run, Firestore/PostgreSQL, queues, and production observability.

## Project Name

```text
CirclCare AI
```
