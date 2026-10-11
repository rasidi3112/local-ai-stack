# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · **العربية** · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>شغّل بيئة الذكاء الاصطناعي الخاصة بك محليًا باستخدام أمر واحد.</strong>
</p>

<p align="center">
  <a href="#quickstart">البدء السريع</a> •
  <a href="#features">الميزات</a> •
  <a href="#presets">الإعدادات المسبقة</a> •
  <a href="#cli-commands">أوامر CLI</a> •
  <a href="#api-gateway">بوابة API</a> •
  <a href="#examples">الأمثلة</a> •
  <a href="#docs">التوثيق</a>
</p>

---

## Overview

`pondok-ai` هي مجموعة أدوات سهلة الاستخدام للمطورين، تجمع بين واجهة سطر الأوامر (CLI) وتنسيق الحاويات، وتتيح تشغيل بيئة ذكاء اصطناعي خاصة ومتكاملة مباشرةً على جهازك المحلي بأقل قدر من الإعداد.

بفضل **Docker Compose v2**، توفر لك `pondok-ai` نماذج لغوية كبيرة (LLMs) محلية، وواجهة للدردشة، وبحثًا متجهيًا، وتخزينًا دائمًا للبيانات، وبوابة API متوافقة مع OpenAI، وذلك خلال ثوانٍ. تتم معالجة المطالبات والمحادثات والتضمينات على جهازك، بينما يتطلب تنزيل صور الحاويات وأوزان النماذج اتصالًا بالإنترنت.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Features

- **المعالجة المحلية**: تعمل المطالبات والمحادثات والتضمينات والاستدلال على أجهزتك المحلية. يتطلب تنزيل صور الحاويات والنماذج لأول مرة اتصالًا بالإنترنت.
- ⚡ **إعداد سهل دون تعقيد**: يكتشف النظام تلقائيًا نظام التشغيل والبنية وذاكرة RAM ووحدة معالجة الرسومات (Apple Metal / NVIDIA CUDA).
- **إعدادات مسبقة مرنة**: يمكنك التوسع من واجهة دردشة خفيفة (`minimal`) إلى بيئة RAG مؤسسية (`standard`) أو خط أنابيب للأتمتة المستقلة (`full`).
- **بوابة متوافقة مع OpenAI**: يمكنك توصيل مكتبات OpenAI SDK القياسية أو LangChain مباشرةً بالعنوان `http://localhost:8000/v1` دون الحاجة إلى إعادة كتابة التعليمات البرمجية.
- **مدير نماذج مدمج**: يمكنك تنزيل النماذج وعرضها وفحصها وحذفها، مع تحذيرات مدمجة بشأن استهلاك ذاكرة RAM ومساحة القرص.
- **تشخيصات استباقية**: يشخّص الأمر المدمج `doctor` تعارضات المنافذ وحالة خدمة Docker وحدود الموارد قبل ظهور المشكلات.

---

## Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                      Host Machine (CLI)                       │
│                                                               │
│   Port 3000                 Port 8000           Port 5678     │
│       │                         │                   │         │
└───────┼─────────────────────────┼───────────────────┼─────────┘
        ▼                         ▼                   ▼
 ┌───────────┐             ┌───────────┐       ┌───────────┐
 │ Open      │             │ API       │       │ n8n       │
 │ WebUI     │             │ Gateway   │       │ (Full)    │
 └─────┬─────┘             └─────┬─────┘       └─────┬─────┘
       │                         │                   │
       ├─────────────────────────┼───────────────────┤
       ▼                         ▼                   ▼
 ┌───────────┐             ┌───────────┐       ┌───────────┐
 │ Ollama    │             │ Qdrant    │       │ Postgres  │
 │ (LLMs)    │             │ (Vector)  │       │ (State)   │
 └───────────┘             └───────────┘       └───────────┘
```

---

## Presets

| الإعداد المسبق | الخدمات المضمنة | الحد الأدنى لذاكرة RAM | الاستخدام الموصى به |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | الدردشة المحلية السريعة والتجارب البسيطة |
| **`standard`** *(الافتراضي)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API Gateway | 16 GB | خطوط أنابيب RAG، وتطوير التطبيقات، وبديل محلي لـ OpenAI |
| **`full`** | Standard + محرك الأتمتة n8n | 16+ GB | وكلاء الذكاء الاصطناعي المستقلون وأتمتة سير العمل بصريًا |

---

## Quickstart

### التثبيت التلقائي بأمر واحد

#### macOS وLinux

```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)

```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### البدء السريع يدويًا باستخدام npx

المتطلبات: Node.js الإصدار 22 أو أحدث، وDocker، وDocker Compose v2.

#### 1. تهيئة البيئة

```bash
# معالج إعداد تفاعلي يكتشف مكونات الجهاز تلقائيًا
npx pondok-ai init

# أو التهيئة دون تفاعل مع اختيار إعداد مسبق
npx pondok-ai init --preset standard --yes
```

#### 2. تشغيل الخدمات مع فحوصات تلقائية للحالة

```bash
npx pondok-ai up
```

بعد التشغيل، يمكنك الوصول إلى الخدمات عبر العناوين التالية:

- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(إذا كان المنفذ متاحًا عبر تعيين المنافذ)*

#### 3. اكتشاف مكونات الجهاز بذكاء والتوصية بالنماذج

```bash
# الحصول على توصيات نماذج مناسبة لمكونات الجهاز استنادًا إلى RAM وVRAM
npx pondok-ai model recommend

# تثبيت نموذج بعد التحقق المسبق من الذاكرة ومساحة القرص
npx pondok-ai model install llama3.2:3b
```

---

## CLI Commands

| الأمر | الوصف |
|---|---|
| `pondok-ai init` | تشغيل معالج إعداد تفاعلي مع اكتشاف مكونات الجهاز |
| `pondok-ai up` | التحقق من إعدادات Compose، وتشغيل الحاويات، وانتظار اكتمال فحوصات الحالة |
| `pondok-ai down` | إيقاف حاويات البيئة وإزالتها |
| `pondok-ai start` | تشغيل الحاويات الموجودة والمتوقفة |
| `pondok-ai stop` | إيقاف الحاويات قيد التشغيل |
| `pondok-ai restart` | إعادة تشغيل حاويات البيئة |
| `pondok-ai status` | عرض حالة الحاويات وعناوين الوصول |
| `pondok-ai logs [service]` | عرض السجلات، مع استخدام `-f` لمتابعتها مباشرةً |
| `pondok-ai doctor` | تشخيص Docker وRAM وGPU/VRAM والمنافذ وتقديم توصيات للنماذج |
| `pondok-ai update` | إعادة تنزيل صور الحاويات المثبتة على إصدارات محددة، مع النسخ الاحتياطي التلقائي وفحوصات الحالة |
| `pondok-ai backup` | نسخ الإعدادات ووحدات تخزين البيانات احتياطيًا مع التحقق من السلامة باستخدام SHA-256 (دون تشفير) |
| `pondok-ai restore <path>` | استعادة نسخة احتياطية بعد التحقق من سلامتها باستخدام SHA-256 (دون تشفير) |
| `pondok-ai reset` | إعادة ضبط البيئة مع الاحتفاظ بوحدات التخزين ما لم يُحدَّد الخيار `--delete-data` |
| `pondok-ai config` | عرض الإعدادات النشطة أو تعديلها |
| `pondok-ai model list` | عرض قائمة النماذج التي تم تنزيلها |
| `pondok-ai model recommend` | التوصية بنماذج مناسبة لمكونات الجهاز (RAM وVRAM ومساحة القرص) |
| `pondok-ai model install <name>` | تنزيل نموذج جديد بعد إجراء فحوصات مسبقة لموارد الجهاز |
| `pondok-ai model remove <name>` | حذف نموذج مثبت |
| `pondok-ai model status` | فحص استهلاك الموارد الخاص بالنماذج |

تُثبَّت صور الحاويات على إصدارات محددة صراحةً. يقوم `pondok-ai update` بتحديث الصور إلى الإصدارات المحددة في الإعدادات، ولا يختار الإصدارات الأحدث تلقائيًا. بعد تثبيت إصدار أحدث من CLI، شغّل `pondok-ai update --upgrade-images` لترحيل وسوم الصور الافتراضية القديمة الخاصة بـ CLI فقط. تظل قيم الصور المخصصة كما هي.

---

## API Gateway

توفر بوابة API نقاط نهاية REST متوافقة مباشرةً مع OpenAI.

اضبط `PONDOK_AI_API_KEY` على قيمة `API_SECRET_KEY` التي تم إنشاؤها قبل استدعاء أي نقطة نهاية ضمن `/v1/*`.

تحدّ البوابة افتراضيًا من عدد الطلبات المصادَق عليها إلى نقاط النهاية `/v1/*` إلى 120 طلبًا في الدقيقة لكل عنوان IP مصدر. إذا احتاج العميل المحلي إلى حدود مختلفة، فاضبط `RATE_LIMIT_MAX_REQUESTS` و`RATE_LIMIT_WINDOW_MS` في ملف `.env`.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "مرحبًا من بيئة الذكاء الاصطناعي المحلية والخاصة بي!" }
    ]
  }'
```

### الاستخدام مع حزمة OpenAI الرسمية لـ Node.js

```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;

if (!apiKey) {
  throw new Error('يرجى تعيين PONDOK_AI_API_KEY إلى قيمة API_SECRET_KEY التي تم إنشاؤها.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [
    { role: 'user', content: 'اشرح الحوسبة الكمومية في جملة واحدة.' }
  ],
});

console.log(completion.choices[0].message.content);
```

---

## Examples

- [`examples/openai-compat/`](./examples/openai-compat): مثال على سكربت تكامل مباشر مع OpenAI SDK.
- [`examples/rag-example/`](./examples/rag-example): مثال متكامل لخط أنابيب RAG باستخدام قاعدة بيانات المتجهات Qdrant وتضمينات Ollama.

---

## Documentation

- [نظرة عامة على البنية المعمارية](./docs/architecture.md)
- [مرجع API Gateway](./docs/api-reference.md)
- [دليل الإعدادات](./docs/configuration.md)
- [إعداد تسريع GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [استكشاف الأخطاء وإصلاحها والتشخيص](./docs/troubleshooting.md)

---

## Contributing

نرحب بالمساهمات! للبدء، يُرجى الاطلاع على [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © 2026 مساهمو pondok-ai
