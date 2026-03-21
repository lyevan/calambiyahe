import { aiService } from './ai.service';
import { aiRepository } from './ai.repository';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./ai.repository');
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    HarmBlockThreshold: {
      BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  };
});

const mockRepo = aiRepository as jest.Mocked<typeof aiRepository>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockHazardZone = {
  zoneId: 'zone-uuid-001',
  startLat: 14.2100,
  startLng: 121.1600,
  endLat: 14.2120,
  endLng: 121.1620,
  hazardType: 'pothole',
  severity: 'high',
  roadName: 'Real Street',
};

const mockRoute = {
  routeId: 'route-uuid-001',
  routeCode: 'CAL-01',
  fromTerminal: 'Crossing Terminal',
  toTerminal: 'Parian Terminal',
  keyStops: ['Real St.', 'Town Plaza', 'Parian'],
};

const mockAllRoutes = [
  mockRoute,
  {
    routeId: 'route-uuid-002',
    routeCode: 'CAL-02',
    fromTerminal: 'Crossing Terminal',
    toTerminal: 'Bucal Terminal',
    keyStops: ['National Hwy', 'Bucal Market'],
  },
];

const mockTerminals = [
  {
    terminalId: 'terminal-uuid-001',
    name: 'Crossing Terminal',
    lat: 14.2116,
    lng: 121.1653,
    routeCodes: ['CAL-01', 'CAL-02', 'CAL-03'],
  },
];

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('aiService.getRerouteSuggestion', () => {
  const validInput = {
    hazardZoneId: 'zone-uuid-001',
    userLat: 14.215,
    userLng: 121.163,
    currentRouteId: 'route-uuid-001',
  };

  const geminiRerouteResponse = JSON.stringify({
    suggestedRouteCode: 'CAL-02',
    message: 'Avoid Real Street. Switch to CAL-02 via National Hwy.',
    alternativeSteps: [
      'Turn back to Crossing Terminal.',
      'Board CAL-02 towards Bucal.',
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.getHazardZoneById.mockResolvedValue(mockHazardZone);
    mockRepo.getRouteById.mockResolvedValue(mockRoute);
    mockRepo.getAllRoutes.mockResolvedValue(mockAllRoutes);
  });

  it('should return a reroute suggestion with correct shape', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: { text: () => geminiRerouteResponse },
      });

    const result = await aiService.getRerouteSuggestion(validInput);

    expect(result).toMatchObject({
      hazardZoneId: validInput.hazardZoneId,
      severity: 'high',
    });
    expect(result.generatedAt).toBeDefined();
    expect(typeof result.message).toBe('string');
    expect(Array.isArray(result.alternativeSteps)).toBe(true);
  });

  it('should throw if hazard zone is not found', async () => {
    mockRepo.getHazardZoneById.mockResolvedValue(null);

    await expect(aiService.getRerouteSuggestion(validInput)).rejects.toThrow(
      'Hazard zone not found',
    );
  });

  it('should fall back gracefully if Gemini returns malformed JSON', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: { text: () => 'NOT VALID JSON AT ALL' },
      });

    const result = await aiService.getRerouteSuggestion(validInput);

    // Should still return a valid DTO using fallback
    expect(result.hazardZoneId).toBe(validInput.hazardZoneId);
    expect(result.suggestedRouteCode).toBeNull();
    expect(typeof result.message).toBe('string');
  });
});

describe('aiService.getTravelTips', () => {
  const validInput = {
    originLat: 14.2116,
    originLng: 121.1653,
    destinationLabel: 'SM City Calamba',
    role: 'commuter' as const,
  };

  const geminiTipsResponse = JSON.stringify({
    tips: [
      'Board CAL-06 at Crossing Terminal.',
      'Alight at SM City Calamba entrance.',
      'Travel time is around 15–20 minutes.',
    ],
    recommendedRouteCode: 'CAL-06',
    fareEstimate: 'PHP 13–15',
    bestTimeToTravel: 'Before 8:00 AM',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.getNearbyTerminals.mockResolvedValue(mockTerminals);
    mockRepo.getAllRoutes.mockResolvedValue(mockAllRoutes);
  });

  it('should return travel tips with correct shape', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: { text: () => geminiTipsResponse },
      });

    const result = await aiService.getTravelTips(validInput);

    expect(Array.isArray(result.tips)).toBe(true);
    expect(result.tips.length).toBeGreaterThan(0);
    expect(result.generatedAt).toBeDefined();
  });

  it('should fall back gracefully if Gemini returns malformed JSON', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: { text: () => '<<<invalid>>>' },
      });

    const result = await aiService.getTravelTips(validInput);

    expect(Array.isArray(result.tips)).toBe(true);
    expect(result.recommendedRouteCode).toBeNull();
  });
});

describe('aiService.analyzeHazardPhoto', () => {
  const validInput = {
    imageBase64: 'base64encodedimagestring',
    mimeType: 'image/jpeg' as const,
    lat: 14.215,
    lng: 121.163,
    reporterNote: 'Malaking lubak sa gitna ng kalsada.',
  };

  const geminiAnalysisResponse = JSON.stringify({
    severity: 'high',
    hazardType: 'pothole',
    description: 'A large pothole approximately 50cm wide is visible in the center lane.',
    recommendedAction: 'Avoid the center lane and reduce speed to below 20 kph.',
    confidence: 0.91,
  });

  it('should return a hazard analysis DTO with clamped confidence', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: { text: () => geminiAnalysisResponse },
      });

    const result = await aiService.analyzeHazardPhoto(validInput);

    expect(result.severity).toBe('high');
    expect(result.hazardType).toBe('pothole');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.generatedAt).toBeDefined();
  });

  it('should clamp out-of-range confidence values', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({ ...JSON.parse(geminiAnalysisResponse), confidence: 1.99 }),
        },
      });

    const result = await aiService.analyzeHazardPhoto(validInput);
    expect(result.confidence).toBe(1);
  });

  it('should use fallback values if Gemini returns malformed JSON', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI('');
    mockGenAI
      .getGenerativeModel()
      .generateContent.mockResolvedValue({
        response: { text: () => 'undefined behavior text' },
      });

    const result = await aiService.analyzeHazardPhoto(validInput);

    expect(result.severity).toBe('medium');
    expect(result.hazardType).toBe('unknown');
    expect(result.confidence).toBe(0.4);
  });
});

// ─── Validation Tests ─────────────────────────────────────────────────────────

describe('AI Zod Validation — GPS Calamba Bounds', () => {
  const { rerouteSchema, travelTipsSchema, hazardAnalysisSchema } = require('./ai.validation');

  it('rerouteSchema: should reject lat outside Calamba bounds', () => {
    const result = rerouteSchema.safeParse({
      hazardZoneId: '00000000-0000-0000-0000-000000000001',
      userLat: 14.10, // ← out of bounds (< 14.18)
      userLng: 121.15,
      currentRouteId: '00000000-0000-0000-0000-000000000002',
    });
    expect(result.success).toBe(false);
  });

  it('rerouteSchema: should reject lng outside Calamba bounds', () => {
    const result = rerouteSchema.safeParse({
      hazardZoneId: '00000000-0000-0000-0000-000000000001',
      userLat: 14.21,
      userLng: 121.20, // ← out of bounds (> 121.18)
      currentRouteId: '00000000-0000-0000-0000-000000000002',
    });
    expect(result.success).toBe(false);
  });

  it('rerouteSchema: should accept valid Calamba coordinates', () => {
    const result = rerouteSchema.safeParse({
      hazardZoneId: '00000000-0000-0000-0000-000000000001',
      userLat: 14.2116,
      userLng: 121.1653,
      currentRouteId: '00000000-0000-0000-0000-000000000002',
    });
    expect(result.success).toBe(true);
  });

  it('travelTipsSchema: should reject invalid role', () => {
    const result = travelTipsSchema.safeParse({
      originLat: 14.21,
      originLng: 121.16,
      destinationLabel: 'SM Calamba',
      role: 'tourist', // ← not a valid role
    });
    expect(result.success).toBe(false);
  });

  it('hazardAnalysisSchema: should reject unsupported mime type', () => {
    const result = hazardAnalysisSchema.safeParse({
      imageBase64: 'abc123',
      mimeType: 'image/gif', // ← not supported
      lat: 14.21,
      lng: 121.16,
    });
    expect(result.success).toBe(false);
  });
});
