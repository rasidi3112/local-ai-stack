# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · **हिन्दी** · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>एक कमांड से अपना स्वयं का निजी AI स्टैक स्थानीय रूप से चलाएं।</strong>
</p>

<p align="center">
  <a href="#त्वरित-शुरुआत">त्वरित शुरुआत</a> •
  <a href="#विशेषताएं">विशेषताएं</a> •
  <a href="#प्रीसेट">प्रीसेट</a> •
  <a href="#cli-कमांड">CLI कमांड</a> •
  <a href="#api-गेटवे">API गेटवे</a> •
  <a href="#उदाहरण">उदाहरण</a> •
  <a href="#दस्तावेज़ीकरण">दस्तावेज़ीकरण</a>
</p>

---

## अवलोकन

`pondok-ai` एक डेवलपर-फ्रेंडली, शून्य-घर्षण CLI और कंटेनर ऑर्केस्ट्रेशन टूलकिट है जो आपके स्थानीय वर्कस्टेशन पर सीधे एक पूर्ण, निजी AI वातावरण बूट करता है।

**Docker Compose v2** द्वारा संचालित, `pondok-ai` आपको सेकंड में स्थानीय LLM, चैट UI, वेक्टर सर्च, डेटाबेस पर्सिस्टेंस, और OpenAI-संगत API गेटवे प्रदान करता है। प्रॉम्प्ट, चैट और एम्बेडिंग आपकी मशीन पर प्रोसेस होते हैं; कंटेनर इमेज और मॉडल वेट को पुल करने के लिए इंटरनेट कनेक्शन की आवश्यकता होती है।

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## विशेषताएं

-  **स्थानीय प्रोसेसिंग**: प्रॉम्प्ट, चैट, एम्बेडिंग और इनफरेंस आपके हार्डवेयर पर चलते हैं। प्रारंभिक कंटेनर इमेज पुल और मॉडल डाउनलोड के लिए इंटरनेट एक्सेस की आवश्यकता है।
- ⚡ **शून्य सेटअप घर्षण**: OS, आर्किटेक्चर, RAM और GPU (Apple Metal / NVIDIA CUDA) का स्वचालित रूप से पता लगाता है।
-  **मॉड्यूलर प्रीसेट**: एक हल्के चैट इंटरफेस (`minimal`) से लेकर एक एंटरप्राइज RAG स्टैक (`standard`) या एक स्वायत्त ऑटोमेशन पाइपलाइन (`full`) तक स्केल करें।
-  **OpenAI-संगत गेटवे**: मानक OpenAI SDK या LangChain को सीधे `http://localhost:8000/v1` पर पॉइंट करें बिना कोड को फिर से लिखे।
-  **बिल्ट-इन मॉडल मैनेजर**: बिल्ट-इन RAM/डिस्क सुरक्षा चेतावनियों के साथ मॉडल को पुल, लिस्ट, इंस्पेक्ट और रिमूव करें।
-  **सेल्फ-हीलिंग डायग्नोस्टिक्स**: बिल्ट-इन `doctor` कमांड आपके समस्याओं में आने से पहले पोर्ट टकराव, Docker डीमन स्टेटस और रिसोर्स लिमिट का निदान करता है।

---

## आर्किटेक्चर

```
┌───────────────────────────────────────────────────────────────┐
│                  होस्ट मशीन (CLI)                             │
│                                                               │
│   पोर्ट 3000            पोर्ट 8000          पोर्ट 5678        │
│       │                     │                   │             │
└───────┼─────────────────────┼───────────────────┼─────────────┘
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Open      │         │ API       │       │ n8n       │
  │ WebUI     │         │ गेटवे     │       │ (Full)    │
  └─────┬─────┘         └─────┬─────┘       └─────┬─────┘
        │                     │                   │
        ├─────────────────────┼───────────────────┤
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Ollama    │         │ Qdrant    │       │ Postgres  │
  │ (LLMs)    │         │ (वेक्टर)  │       │ (स्टेट)   │
  └───────────┘         └───────────┘       └───────────┘
```

---

## प्रीसेट

| प्रीसेट | शामिल सेवाएं | न्यूनतम RAM | अनुशंसित उपयोग |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | त्वरित स्थानीय चैट, हल्का प्रयोग |
| **`standard`** *(डिफ़ॉल्ट)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API गेटवे | 16 GB | RAG पाइपलाइन, ऐप विकास, OpenAI प्रतिस्थापन |
| **`full`** | Standard + n8n ऑटोमेशन इंजन | 16+ GB | स्वायत्त AI एजेंट, विजुअल वर्कफ़्लो ऑटोमेशन |

---

## त्वरित शुरुआत

### स्वचालित वन-कमांड इंस्टॉलेशन

#### macOS और Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### npx के माध्यम से मैनुअल त्वरित शुरुआत

पूर्वापेक्षाएँ: Node.js 22 या बाद का संस्करण, Docker, और Docker Compose v2।

#### 1. स्टैक को इनिशियलाइज़ करें
```bash
# हार्डवेयर ऑटो-डिटेक्शन के साथ इंटरैक्टिव सेटअप विज़ार्ड
npx pondok-ai init

# या चुने गए प्रीसेट के साथ नॉन-इंटरैक्टिव
npx pondok-ai init --preset standard --yes
```

#### 2. स्वचालित स्वास्थ्य जांच के साथ सेवाएं शुरू करें
```bash
npx pondok-ai up
```

एक बार चलने के बाद, अपने स्टैक तक पहुंचें:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API गेटवे**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(जब मैप किया गया हो)*

#### 3. स्मार्ट हार्डवेयर डिटेक्शन और मॉडल रेकमेंडेशन
```bash
# अपने RAM/VRAM के आधार पर स्मार्ट हार्डवेयर-जागरूक सिफारिशें प्राप्त करें
npx pondok-ai model recommend

# प्री-फ्लाइट मेमोरी और डिस्क सुरक्षा जांच के साथ मॉडल इंस्टॉल करें
npx pondok-ai model install llama3.2:3b
```

---

## CLI कमांड

| कमांड | विवरण |
|---|---|
| `pondok-ai init` | हार्डवेयर डिटेक्शन के साथ इंटरैक्टिव कॉन्फ़िगरेशन विज़ार्ड चलाएं |
| `pondok-ai up` | Compose कॉन्फ़िग को वैलिडेट करें, कंटेनर बूट करें, और हेल्थ चेक की प्रतीक्षा करें |
| `pondok-ai down` | स्टैक कंटेनर को रोकें और हटाएं |
| `pondok-ai start` | मौजूदा रुके हुए कंटेनर शुरू करें |
| `pondok-ai stop` | चल रहे कंटेनर को रोकें |
| `pondok-ai restart` | स्टैक कंटेनर को रीस्टार्ट करें |
| `pondok-ai status` | कंटेनर हेल्थ और URL दिखाएं |
| `pondok-ai logs [सेवा]` | लॉग देखें (स्ट्रीम करने के लिए `-f`) |
| `pondok-ai doctor` | Docker, RAM, GPU/VRAM, पोर्ट्स और मॉडल सिफारिशों का निदान करें |
| `pondok-ai update` | स्वचालित बैकअप और हेल्थ चेक के साथ कॉन्फ़िगर किए गए पिन किए गए इमेज को फिर से पुल करें |
| `pondok-ai backup` | SHA-256 इंटीग्रिटी चेक के साथ कॉन्फ़िग और डेटा वॉल्यूम का बैकअप लें (एन्क्रिप्ट नहीं) |
| `pondok-ai restore <पथ>` | SHA-256 इंटीग्रिटी-चेक किए गए बैकअप से रिस्टोर करें (एन्क्रिप्ट नहीं) |
| `pondok-ai reset` | स्टैक को रीसेट करें (`--delete-data` निर्दिष्ट न होने पर वॉल्यूम संरक्षित करता है) |
| `pondok-ai config` | सक्रिय कॉन्फ़िगरेशन का निरीक्षण या संपादन करें |
| `pondok-ai model list` | डाउनलोड किए गए मॉडल की सूची बनाएं |
| `pondok-ai model recommend` | हार्डवेयर-अनुकूलित मॉडल सिफारिशें (RAM, VRAM, डिस्क) |
| `pondok-ai model install <नाम>` | प्री-फ्लाइट रिसोर्स सुरक्षा जांच के साथ नया मॉडल पुल करें |
| `pondok-ai model remove <नाम>` | इंस्टॉल किए गए मॉडल को डिलीट करें |
| `pondok-ai model status` | मॉडल रिसोर्स फुटप्रिंट का निरीक्षण करें |

इमेज स्पष्ट संस्करणों पर पिन की जाती हैं। `pondok-ai update` कॉन्फ़िगर किए गए संस्करणों को रिफ्रेश करता है; यह नए रिलीज का चयन नहीं करता है। एक नया CLI इंस्टॉल करने के बाद, केवल CLI के लिगेसी डिफ़ॉल्ट इमेज टैग को माइग्रेट करने के लिए `pondok-ai update --upgrade-images` चलाएं। कस्टम इमेज वैल्यू संरक्षित हैं।

---

## API गेटवे

API गेटवे ड्रॉप-इन OpenAI REST एंडपॉइंट प्रदान करता है:

`/v1/*` एंडपॉइंट को कॉल करने से पहले `PONDOK_AI_API_KEY` को जेनरेट की गई `API_SECRET_KEY` पर सेट करें।

गेटवे डिफ़ॉल्ट रूप से स्रोत IP प्रति प्रमाणित `/v1/*` अनुरोधों को प्रति मिनट 120 अनुरोधों तक सीमित करता है। यदि आपके स्थानीय क्लाइंट को विभिन्न सीमाओं की आवश्यकता है तो `.env` में `RATE_LIMIT_MAX_REQUESTS` और `RATE_LIMIT_WINDOW_MS` को कॉन्फ़िगर करें।

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "मेरे निजी स्थानीय AI स्टैक से नमस्ते!" }
    ]
  }'
```

### आधिकारिक OpenAI Node.js SDK के साथ उपयोग
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('PONDOK_AI_API_KEY को अपनी जेनरेट की गई API_SECRET_KEY पर सेट करें।');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'क्वांटम कंप्यूटिंग को एक वाक्य में समझाएं।' }],
});

console.log(completion.choices[0].message.content);
```

---

## उदाहरण

- [`examples/openai-compat/`](./examples/openai-compat): ड्रॉप-इन OpenAI SDK एकीकरण स्क्रिप्ट।
- [`examples/rag-example/`](./examples/rag-example): Qdrant वेक्टर डेटाबेस और Ollama एम्बेडिंग का उपयोग करते हुए एंड-टू-एंड RAG पाइपलाइन।

---

## दस्तावेज़ीकरण

- [आर्किटेक्चर अवलोकन](./docs/architecture.md)
- [API गेटवे संदर्भ](./docs/api-reference.md)
- [कॉन्फ़िगरेशन गाइड](./docs/configuration.md)
- [GPU एक्सेलेरेशन सेटअप (Metal / CUDA)](./docs/gpu-setup.md)
- [समस्या निवारण और निदान](./docs/troubleshooting.md)

---

## योगदान

योगदान का स्वागत है! शुरू करने के लिए [CONTRIBUTING.md](./CONTRIBUTING.md) देखें।

## लाइसेंस

[MIT](./LICENSE) © 2026 pondok-ai योगदानकर्ता
