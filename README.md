# Social Media Content Creator Agent

A LangGraph-based Node.js application that generates social media content plans using local LLMs with Ollama.

## 🎯 What This Code Does

This application creates a 30-day social media content plan with:

* **Topics**: Relevant content ideas for your brand theme
* **Captions**: Engaging 1-2 sentence captions for each topic
* **Hashtags**: 3-5 relevant hashtags for each post
* **CSV Export**: Structured output in `content_calendar.csv`

### LangGraph Node Structure


1. **Day Planner Node**: Generates topic ideas using LLM with template fallback
2. **Content Generator Node**: Creates captions and hashtags for each topic
3. **Formatter Node**: Validates and structures the content
4. **Save Node**: Exports to CSV files

## 🚀 Quick Start

### 1. Install Ollama

```bash
# Download and install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
ollama serve
```

### 2. Download and Run Model

```bash
# Download a small, fast model
ollama pull smollm

# Verify model is available
ollama list
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Update environment file
cp .env.example .env
```

### 4. Configure Environment

Edit `.env` file:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=smollm
```

### 5. Run the Application

#### Command Line Mode

```bash
# Generate 7-day content plan
node src/main.js "Fitness for Busy Professionals" 7

# Generate 30-day content plan
node src/main.js "Mental Health for Gen Z" 30
```

#### Web UI Mode

```bash
# Start web interface
node src/main.js --web
```

### 6. Access Web UI

Open your browser and go to:

```
http://localhost:3000
```

## 📋 Usage Examples

### Command Line

```bash
# Fitness content for busy professionals
node src/main.js "Fitness for Busy Professionals" 15

# Mental health content for Gen Z
node src/main.js "Mental Health for Gen Z" 7

# Business growth strategies
node src/main.js "Business Growth Strategies" 30
```

### Web Interface


1. Enter your brand theme (e.g., "Fitness for Busy Professionals")
2. Select duration (1-30 days)
3. Click "Generate Content Plan"
4. Download the CSV file

## 📁 Output Files

The application generates:

* `content_calendar.csv` - Main output file
* `content_calendar_YYYY-MM-DD.csv` - Timestamped backup

## 🔧 Technical Details

### Requirements

* Node.js 18+
* Ollama (for local LLM)
* 4GB RAM minimum
* 2GB free disk space

### Architecture

* **LangGraph**: Modular agent workflow
* **Ollama**: Local LLM inference
* **Express.js**: Web server
* **CSV Writer**: Data export

### LLM Models Supported

* `smollm` (recommended - fast and small)
* `llama2` (larger, better quality)
* Any Ollama-compatible model

## 🛠️ Troubleshooting

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
sudo systemctl restart ollama
```

### Model Download Issues

```bash
# Pull a different model
ollama pull llama2

# Update .env file
OLLAMA_MODEL=llama2
```

### Web UI Not Loading

```bash
# Check if port 3000 is available
lsof -i :3000

# Use different port
PORT=3001 node src/main.js --web
```

## 📊 API Endpoints

When running in web mode:

* `GET /` - Web interface
* `POST /api/generate` - Generate content
* `GET /api/status` - System status
* `GET /api/download/:filename` - Download CSV

## 🎯 Features

* ✅ **Local LLM**: No API costs, privacy-focused
* ✅ **Template Fallback**: Works when LLM fails
* ✅ **Web Interface**: User-friendly UI
* ✅ **CSV Export**: Structured data output
* ✅ **Configurable Duration**: 1-30 days
* ✅ **Multiple Themes**: Fitness, Mental Health, Business, etc.

## 📝 License

MIT License - Feel free to use and modify for your projects.