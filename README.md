# A2 Mini CRM

Небольшое CRM-приложение для создания и просмотра лидов. React-интерфейс и
FastAPI API работают на русском, английском и узбекском языках. Локальная
разработка использует SQLite, а production — управляемый PostgreSQL в
Supabase. Этап сделки можно изменить прямо в карточке без перезагрузки.

## Технологии

- Python 3.12+, FastAPI, Uvicorn, Pydantic
- SQLite через `sqlite3` локально и Supabase PostgreSQL через Psycopg в production
- React, TypeScript и Vite
- Tailwind CSS, shadcn/ui и Lucide React
- i18next и react-i18next для русского, английского и узбекского интерфейса
- pytest, ESLint
- uv для Python-зависимостей и npm для frontend-зависимостей

## Структура

```text
app/
├── main.py                 # FastAPI, CORS и API-маршруты
├── api_errors.py           # стабильные коды и единый формат ошибок
├── config.py               # выбор БД и безопасный CORS allowlist
├── database.py             # общий SQLite/PostgreSQL слой без ORM
├── domain/lead_stage.py    # допустимые переходы этапов
├── i18n/                   # resolver языка и backend-переводы ru/en/uz
├── schemas.py              # Pydantic-схемы и стабильные enum-значения
└── validation.py           # преобразование ошибок Pydantic
frontend/
├── src/api/                # единый HTTP-клиент и функции API
├── src/components/         # форма, список, карточка и общие компоненты
├── src/i18n/               # настройка i18next и JSON-переводы ru/en/uz
├── src/pages/LeadsPage.tsx # композиция главной страницы
└── src/types/              # TypeScript-типы API
tests/                      # изолированные backend-тесты
supabase/migrations/        # production-схема PostgreSQL
.github/workflows/tests.yml # backend-тесты, frontend lint и build
package.json                # одновременный запуск API и Vite
render.yaml                 # Render FastAPI Blueprint
vercel.json                 # Vercel Vite build
```

## Архитектура

```text
Browser (React + i18next + shadcn/ui)
                 │ /api через Vite proxy
                 ▼
FastAPI ──► Pydantic validation ──► domain transition rules
                 │
                 ▼
parameterized SQL ──┬── local SQLite: crm.sqlite3
                    └── production: Supabase PostgreSQL
                        ├── leads
                        └── lead_stage_history
```

Frontend отвечает за представление и состояния интерфейса. Backend является
источником истины для валидации, дублей, переходов, пагинации и статистики.

## Требования и локальный запуск

Потребуются [uv](https://docs.astral.sh/uv/) и Node.js 24 с npm.

Backend запускается независимо:

```shell
uv sync
uv run uvicorn app.main:app --reload
```

Frontend запускается независимо:

```shell
cd frontend
npm install
npm run dev
```

Оба процесса одной командой из корня:

```shell
npm install
npm run dev
```

Откройте <http://localhost:5173>. Vite перенаправляет `/api` на
`http://127.0.0.1:8000`. Для другого адреса API скопируйте
`frontend/.env.example` в `frontend/.env` и измените `VITE_API_BASE_URL`.
Документация FastAPI доступна по адресу <http://127.0.0.1:8000/docs>.

### Переменные окружения

Шаблоны находятся в `.env.example` и `frontend/.env.example`; реальные `.env`
не коммитятся.

| Переменная | Назначение | Значение по умолчанию |
|---|---|---|
| `DATABASE_PATH` | путь к SQLite | `crm.sqlite3` |
| `DATABASE_URL` | backend-only URL Supabase PostgreSQL | пусто |
| `CORS_ORIGINS` | разрешённые origins через запятую | localhost/127.0.0.1:5173 |
| `VITE_API_BASE_URL` | базовый URL API в production | пусто |
| `VITE_PROXY_TARGET` | цель Vite dev proxy | `http://127.0.0.1:8000` |

Wildcard CORS не используется.

`DATABASE_URL` имеет приоритет над `DATABASE_PATH`. Его нельзя добавлять во
frontend или коммитить. Для Render подходит Supabase Session Pooler на порту
5432 с `sslmode=require`.

## Проверки и production build

```shell
uv sync --frozen
uv run pytest
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

GitHub Actions выполняет те же проверки из lock-файлов `uv.lock` и
`frontend/package-lock.json`.

## Хранение данных и значения API

Без `DATABASE_URL` API создаёт локальные `crm.sqlite3`, `leads` и
`lead_stage_history`. С `DATABASE_URL` используется та же модель в PostgreSQL.
Миграции Supabase в `supabase/migrations/` — единственный источник production-
схемы; при запуске FastAPI проверяет наличие нужных таблиц. Таблицы защищены RLS,
а доступ ролей `anon` и `authenticated` отозван: браузер работает только через
FastAPI. Файлы SQLite исключены из Git, тесты используют временные базы.

API хранит стабильные, независимые от языка идентификаторы:

- `lead_source`: `cold`, `warm`
- `responsible`: `lead_generator`, `sales_manager`
- `deal_stage`: `new`, `qualified`, `consultation_scheduled`, `rejected`

Старые русские значения автоматически переводятся в эти идентификаторы при
инициализации базы. Пользовательские подписи переводятся только во frontend.

## API

| Метод | Путь | Назначение | Статус |
|---|---|---|---|
| `GET` | `/api/health` | Проверка доступности API | `200` |
| `GET` | `/api/leads` | Получить лиды, новые первыми | `200` |
| `POST` | `/api/leads` | Создать лид | `201` |
| `PATCH` | `/api/leads/{lead_id}/stage` | Изменить этап сделки | `200` |
| `GET` | `/api/leads/{lead_id}/history` | История этапов | `200` |

`GET /api/leads` возвращает `items`, `pagination` и `summary`. Поддерживаются
`search`, `lead_source`, `responsible`, `deal_stage`,
`technical_spec_requested`, `created_from`, `created_to`, `sort`, `order`,
`page` и `page_size` (максимум 100). Статистика относится ко всему
отфильтрованному результату, а не только к текущей странице.

### Язык и ошибки API

Клиент передаёт язык через `Accept-Language`. API понимает `ru`, `en`, `uz`,
региональные формы (`en-US`, `uz-UZ`) и списки с приоритетами
(`ru,en;q=0.9`). Если поддерживаемого языка нет или заголовок некорректен,
используется русский. Фактический язык указан в `Content-Language`.

У ошибок один формат. Код и ключи полей не переводятся:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Проверьте введённые данные",
    "fields": {
      "client_name": "Имя клиента обязательно"
    }
  }
}
```

Возможные стабильные коды: `VALIDATION_ERROR`, `LEAD_NOT_FOUND`,
`DUPLICATE_LEAD`, `INVALID_STAGE_TRANSITION`, `DATABASE_ERROR` и
`UNSUPPORTED_OPERATION`. Backend-переводы находятся в
`app/i18n/locales/`. Технические enum-значения в базе и JSON не переводятся.

Телефон допускает цифры, пробелы, `+`, скобки и дефисы и должен содержать от
7 до 15 цифр. Повторный лид с тем же номером после удаления форматирующих
символов возвращает `DUPLICATE_LEAD`.

Допустимые переходы этапов:

- `new` → `qualified` или `rejected`;
- `qualified` → `consultation_scheduled` или `rejected`;
- `consultation_scheduled` → `rejected`;
- `rejected` → `new`;
- повторная установка текущего этапа разрешена.

Реальное изменение этапа и запись истории выполняются одной транзакцией в
обеих БД. Повторная установка текущего этапа не создаёт историю.

## Production-развёртывание

Production разделён на три сервиса:

```text
Vercel (React/Vite) → Render (FastAPI) → Supabase (PostgreSQL)
```

- `vercel.json` собирает только `frontend/`;
- `render.yaml` запускает stateless FastAPI на Python 3.12 через uv;
- `DATABASE_URL` хранится только в Render;
- production `/api` проксируется Vercel на Render без раскрытия DB-настроек;
- `CORS_ORIGINS` содержит точный production-origin Vercel для прямых API-вызовов.

Render Blueprint использует бесплатный instance и `/api/health`. Бесплатный
instance может засыпать, поэтому первый запрос после простоя иногда медленнее.
Для постоянной низкой задержки можно выбрать платный instance без изменения
кода.

## Как работает интерфейс

`frontend/src/components/LeadForm.tsx` проверяет обязательные поля и запускает
сохранение. Запросы сосредоточены в `frontend/src/api/`, а
`frontend/src/hooks/useLeads.ts` отвечает за загрузку, debounce поиска, отмену
устаревших запросов, URL-параметры, создание и изменение этапа.

Интерфейс собран из небольшого набора компонентов shadcn/ui. На широком экране
лиды показаны таблицей, а на мобильном — компактными карточками. Статистика
приходит с API для всех подходящих лидов. История этапов загружается лениво при
открытии диалога деталей.
Цвета, радиусы и семантические состояния заданы CSS-переменными в
`frontend/src/index.css`.

При смене этапа selector временно блокируется. После успешного PATCH карточка
обновляется без перезагрузки; при ошибке остаётся прежнее значение и выводится
понятное сообщение. React экранирует отображаемые пользовательские данные.

Выбранный язык сохраняется в `localStorage` под ключом `crm.language`.
Переключение языка не перезагружает страницу, обновляет `<html lang>` и
автоматически добавляет выбранное значение в заголовок `Accept-Language`
каждого API-запроса. Переводы разделены на пространства имён `common`, `leads`
и `validation`.

## Ручная демонстрация

1. Запустите API и Vite, затем откройте `http://localhost:5173`.
2. Отправьте пустую форму и проверьте локализованные ошибки.
3. Заполните все поля и сохраните лид — новая карточка должна появиться первой.
4. Обновите страницу и перезапустите API — карточка должна сохраниться.
5. Измените этап в карточке и убедитесь, что страница не перезагружается.
6. Переключите язык через список в заголовке: данные API останутся прежними, а
   подписи изменятся. Также проверьте узбекский язык и сохранение выбора после
   обновления.
7. Проверьте поиск, фильтры, сортировку, пагинацию и диалог истории.

## Скриншоты

Перед демонстрацией добавьте актуальные desktop/mobile снимки в
`docs/screenshots/` и разместите ссылки здесь. Устаревающие фиктивные
изображения намеренно не добавлены.

## Использование нейросети

Первичная структура backend и прежнего интерфейса, миграция frontend на
React/TypeScript и профессиональное оформление на Tailwind/shadcn были
подготовлены с AI-помощью. Вручную проверены структура компонентов, типы,
SQL-параметры, HTTP-статусы, обработка ошибок, переводы, зависимости и CI.

В браузере вручную проверены обязательные поля, создание и повторная загрузка
лида, смена этапа, переключение языка и отсутствие ошибок консоли. Во время
ревью были исправлены TypeScript-настройки шаблона, синхронизация lock-файла,
CORS для Vite и миграция старых русских enum-значений. Это не заявление о том,
что каждая строка написана вручную.

## Известные ограничения

- Нет аутентификации, разграничения доступа и удаления лидов.
- Проверка телефона не подтверждает, что номер реально существует.
- Редактируется только этап сделки.
- SQLite рассчитан только на локальную разработку; production использует Supabase.
- Нет полнотекстового индекса: поиск рассчитан на объём тестового задания.
- История содержит изменения, выполненные после появления этой функции.
