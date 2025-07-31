import axios from 'axios';

class AIService {
  constructor() {
    this.models = new Map();
    this.contextManager = new ContextManager();
    this.errorHandler = new ErrorHandler();
    this.agentManager = new AgentManager();
    this.localModels = new LocalModelManager();
    
    // Initialize default configurations
    this.initializeDefaultModels();
  }

  initializeDefaultModels() {
    // OpenAI Models
    this.registerModel('openai-gpt4', {
      provider: 'openai',
      model: 'gpt-4',
      maxTokens: 8192,
      contextWindow: 8192,
      capabilities: ['chat', 'code', 'analysis'],
      priority: 1
    });

    this.registerModel('openai-gpt4-turbo', {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: ['chat', 'code', 'analysis', 'large-context'],
      priority: 2
    });

    // Anthropic Models
    this.registerModel('claude-3-opus', {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
      contextWindow: 200000,
      capabilities: ['chat', 'code', 'analysis', 'large-context'],
      priority: 3
    });

    // Local Models
    this.registerModel('local-codellama', {
      provider: 'local',
      model: 'codellama-7b',
      maxTokens: 2048,
      contextWindow: 4096,
      capabilities: ['code', 'completion'],
      priority: 4,
      offline: true
    });

    this.registerModel('local-mistral', {
      provider: 'local',
      model: 'mistral-7b',
      maxTokens: 2048,
      contextWindow: 8192,
      capabilities: ['chat', 'code'],
      priority: 5,
      offline: true
    });
  }

  registerModel(id, config) {
    this.models.set(id, {
      id,
      ...config,
      status: 'inactive',
      lastUsed: null,
      errorCount: 0,
      successCount: 0
    });
  }

  async initializeModel(modelId, apiConfig) {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    try {
      if (model.provider === 'local') {
        await this.localModels.loadModel(model);
      } else {
        // Test API connection
        await this.testModelConnection(model, apiConfig);
      }
      
      model.status = 'active';
      model.config = apiConfig;
      return true;
    } catch (error) {
      model.status = 'error';
      model.lastError = error.message;
      throw error;
    }
  }

  async testModelConnection(model, config) {
    const testMessage = "Hello, this is a connection test.";
    
    switch (model.provider) {
      case 'openai':
        return await this.callOpenAI(model, [{ role: 'user', content: testMessage }], config);
      case 'anthropic':
        return await this.callAnthropic(model, testMessage, config);
      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  async generateResponse(prompt, options = {}) {
    const {
      capability = 'chat',
      context = '',
      modelPreference = null,
      multiModel = false,
      maxRetries = 3
    } = options;

    try {
      // Select appropriate model(s)
      const selectedModels = this.selectModels(capability, modelPreference, multiModel);
      
      // Prepare context with large context handling
      const processedContext = await this.contextManager.processContext(context, prompt);
      
      if (multiModel) {
        return await this.multiModelGeneration(selectedModels, prompt, processedContext, options);
      } else {
        return await this.singleModelGeneration(selectedModels[0], prompt, processedContext, options);
      }
    } catch (error) {
      return await this.errorHandler.handleError(error, prompt, options, maxRetries);
    }
  }

  selectModels(capability, preference, multiModel) {
    let availableModels = Array.from(this.models.values())
      .filter(model => 
        model.status === 'active' && 
        model.capabilities.includes(capability)
      )
      .sort((a, b) => a.priority - b.priority);

    if (preference) {
      const preferredModel = availableModels.find(m => m.id === preference);
      if (preferredModel) {
        availableModels = [preferredModel, ...availableModels.filter(m => m.id !== preference)];
      }
    }

    if (multiModel) {
      // Return top 3 models for multi-model processing
      return availableModels.slice(0, 3);
    } else {
      return availableModels.slice(0, 1);
    }
  }

  async singleModelGeneration(model, prompt, context, options) {
    const fullPrompt = this.buildPrompt(prompt, context, options);
    
    try {
      let response;
      switch (model.provider) {
        case 'openai':
          response = await this.callOpenAI(model, fullPrompt, model.config);
          break;
        case 'anthropic':
          response = await this.callAnthropic(model, fullPrompt, model.config);
          break;
        case 'local':
          response = await this.localModels.generate(model, fullPrompt);
          break;
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      model.successCount++;
      model.lastUsed = new Date();
      
      return {
        response: response.content,
        model: model.id,
        tokens: response.tokens,
        confidence: response.confidence || 0.8
      };
    } catch (error) {
      model.errorCount++;
      throw error;
    }
  }

  async multiModelGeneration(models, prompt, context, options) {
    const promises = models.map(model => 
      this.singleModelGeneration(model, prompt, context, options)
        .catch(error => ({ error: error.message, model: model.id }))
    );

    const results = await Promise.all(promises);
    const successfulResults = results.filter(r => !r.error);
    
    if (successfulResults.length === 0) {
      throw new Error('All models failed to generate response');
    }

    // Combine and rank responses
    return this.combineMultiModelResponses(successfulResults, options);
  }

  combineMultiModelResponses(responses, options) {
    // Sort by confidence and model priority
    responses.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    
    const primary = responses[0];
    const alternatives = responses.slice(1);

    return {
      response: primary.response,
      model: primary.model,
      confidence: primary.confidence,
      alternatives: alternatives.map(r => ({
        response: r.response,
        model: r.model,
        confidence: r.confidence
      })),
      consensus: this.calculateConsensus(responses)
    };
  }

  calculateConsensus(responses) {
    // Simple consensus calculation based on response similarity
    if (responses.length < 2) return 1.0;
    
    let similaritySum = 0;
    let comparisons = 0;
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        similaritySum += this.calculateSimilarity(responses[i].response, responses[j].response);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? similaritySum / comparisons : 0;
  }

  calculateSimilarity(text1, text2) {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  buildPrompt(prompt, context, options) {
    const { systemPrompt, temperature = 0.7, includeContext = true } = options;
    
    let messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    if (includeContext && context) {
      messages.push({ role: 'system', content: `Context: ${context}` });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return messages;
  }

  async callOpenAI(model, messages, config) {
    const response = await axios.post(
      config.baseUrl || 'https://api.openai.com/v1/chat/completions',
      {
        model: model.model,
        messages,
        max_tokens: model.maxTokens,
        temperature: config.temperature || 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      tokens: response.data.usage.total_tokens,
      confidence: 0.8
    };
  }

  async callAnthropic(model, messages, config) {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await axios.post(
      config.baseUrl || 'https://api.anthropic.com/v1/messages',
      {
        model: model.model,
        max_tokens: model.maxTokens,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return {
      content: response.data.content[0].text,
      tokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
      confidence: 0.85
    };
  }

  // Agent-based code analysis and improvement
  async analyzeCode(code, language, options = {}) {
    const analysisAgents = [
      'syntax-analyzer',
      'performance-analyzer', 
      'security-analyzer',
      'best-practices-analyzer'
    ];

    const results = await Promise.all(
      analysisAgents.map(agent => 
        this.agentManager.runAgent(agent, { code, language, ...options })
      )
    );

    return this.agentManager.combineAnalysisResults(results);
  }

  async improveCode(code, language, issues, options = {}) {
    return await this.agentManager.runAgent('code-improver', {
      code,
      language,
      issues,
      ...options
    });
  }

  // Self-evolving capabilities
  async evolvePrompts(taskType, performance) {
    return await this.agentManager.runAgent('prompt-evolver', {
      taskType,
      performance,
      history: this.getTaskHistory(taskType)
    });
  }

  getTaskHistory(taskType) {
    // Return historical performance data for this task type
    return this.contextManager.getTaskHistory(taskType);
  }

  // Model performance monitoring
  getModelStats() {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      provider: model.provider,
      status: model.status,
      successRate: model.successCount / (model.successCount + model.errorCount) || 0,
      lastUsed: model.lastUsed,
      capabilities: model.capabilities
    }));
  }
}

// Context Manager for handling large contexts
class ContextManager {
  constructor() {
    this.maxContextSize = 100000; // characters
    this.chunkSize = 8000;
    this.contextCache = new Map();
  }

  async processContext(context, prompt) {
    if (!context || context.length <= this.maxContextSize) {
      return context;
    }

    // For large contexts, use chunking and summarization
    const chunks = this.chunkContext(context);
    const relevantChunks = await this.selectRelevantChunks(chunks, prompt);
    
    if (relevantChunks.join('').length <= this.maxContextSize) {
      return relevantChunks.join('\n\n');
    }

    // If still too large, summarize
    return await this.summarizeContext(relevantChunks);
  }

  chunkContext(context) {
    const chunks = [];
    for (let i = 0; i < context.length; i += this.chunkSize) {
      chunks.push(context.slice(i, i + this.chunkSize));
    }
    return chunks;
  }

  async selectRelevantChunks(chunks, prompt) {
    // Simple relevance scoring based on keyword overlap
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/));
    
    const scoredChunks = chunks.map(chunk => {
      const chunkWords = new Set(chunk.toLowerCase().split(/\s+/));
      const overlap = new Set([...promptWords].filter(x => chunkWords.has(x)));
      const score = overlap.size / promptWords.size;
      return { chunk, score };
    });

    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(chunks.length * 0.3)) // Top 30% of chunks
      .map(item => item.chunk);
  }

  async summarizeContext(chunks) {
    // This would use a summarization model
    // For now, return a truncated version
    const combined = chunks.join('\n\n');
    return combined.slice(0, this.maxContextSize);
  }

  getTaskHistory(taskType) {
    return this.contextCache.get(`history_${taskType}`) || [];
  }
}

// Error Handler with recovery strategies
class ErrorHandler {
  constructor() {
    this.errorStrategies = new Map();
    this.initializeStrategies();
  }

  initializeStrategies() {
    this.errorStrategies.set('rate_limit', {
      retry: true,
      delay: 60000, // 1 minute
      fallback: 'use_different_model'
    });

    this.errorStrategies.set('context_too_large', {
      retry: true,
      action: 'reduce_context',
      fallback: 'chunk_request'
    });

    this.errorStrategies.set('api_error', {
      retry: true,
      delay: 5000,
      maxRetries: 3,
      fallback: 'use_local_model'
    });
  }

  async handleError(error, prompt, options, maxRetries) {
    const errorType = this.classifyError(error);
    const strategy = this.errorStrategies.get(errorType);

    if (!strategy || maxRetries <= 0) {
      throw error;
    }

    if (strategy.delay) {
      await this.delay(strategy.delay);
    }

    // Apply error-specific handling
    switch (errorType) {
      case 'context_too_large':
        options.reduceContext = true;
        break;
      case 'rate_limit':
        options.modelPreference = 'local-mistral';
        break;
    }

    // Retry with modified options
    return this.retryWithStrategy(prompt, options, maxRetries - 1);
  }

  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'rate_limit';
    }
    if (message.includes('context') || message.includes('token')) {
      return 'context_too_large';
    }
    return 'api_error';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retryWithStrategy(prompt, options, retries) {
    // This would call back to the main generateResponse method
    // Implementation depends on the calling context
    throw new Error('Retry failed - implement retry logic');
  }
}

// Agent Manager for specialized AI agents
class AgentManager {
  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    // Syntax Analysis Agent
    this.agents.set('syntax-analyzer', {
      systemPrompt: `You are a syntax analysis expert. Analyze code for syntax errors, 
                    missing imports, and structural issues. Return findings in JSON format.`,
      model: 'openai-gpt4',
      temperature: 0.1
    });

    // Performance Analysis Agent
    this.agents.set('performance-analyzer', {
      systemPrompt: `You are a performance optimization expert. Identify performance 
                    bottlenecks, inefficient algorithms, and suggest optimizations.`,
      model: 'claude-3-opus',
      temperature: 0.2
    });

    // Security Analysis Agent
    this.agents.set('security-analyzer', {
      systemPrompt: `You are a security expert. Identify potential security vulnerabilities, 
                    unsafe practices, and suggest security improvements.`,
      model: 'openai-gpt4',
      temperature: 0.1
    });

    // Code Improvement Agent
    this.agents.set('code-improver', {
      systemPrompt: `You are a code improvement specialist. Given code and identified issues, 
                    provide improved versions that fix the issues while maintaining functionality.`,
      model: 'claude-3-opus',
      temperature: 0.3
    });

    // Prompt Evolution Agent
    this.agents.set('prompt-evolver', {
      systemPrompt: `You are a prompt optimization expert. Analyze prompt performance and 
                    suggest improvements to increase effectiveness.`,
      model: 'openai-gpt4-turbo',
      temperature: 0.4
    });
  }

  async runAgent(agentId, input) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // This would integrate with the main AI service
    // For now, return mock results
    return {
      agent: agentId,
      result: `Mock result from ${agentId}`,
      confidence: 0.8,
      timestamp: new Date()
    };
  }

  combineAnalysisResults(results) {
    return {
      combined: true,
      results,
      summary: this.generateSummary(results),
      priority: this.prioritizeIssues(results)
    };
  }

  generateSummary(results) {
    return `Analysis complete. Found ${results.length} categories of issues.`;
  }

  prioritizeIssues(results) {
    // Prioritize issues by severity and type
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}

// Local Model Manager for offline capabilities
class LocalModelManager {
  constructor() {
    this.loadedModels = new Map();
    this.modelPaths = new Map();
  }

  async loadModel(model) {
    if (this.loadedModels.has(model.id)) {
      return this.loadedModels.get(model.id);
    }

    // In a real implementation, this would load models using:
    // - ONNX Runtime for web
    // - TensorFlow.js
    // - WebLLM
    // - Local API endpoints (Ollama, etc.)
    
    console.log(`Loading local model: ${model.id}`);
    
    // Mock implementation
    const mockModel = {
      id: model.id,
      loaded: true,
      generate: async (prompt) => ({
        content: `Mock response from ${model.id}: ${prompt.slice(0, 50)}...`,
        tokens: 100,
        confidence: 0.7
      })
    };

    this.loadedModels.set(model.id, mockModel);
    return mockModel;
  }

  async generate(model, prompt) {
    const loadedModel = await this.loadModel(model);
    return await loadedModel.generate(prompt);
  }

  unloadModel(modelId) {
    this.loadedModels.delete(modelId);
  }

  getLoadedModels() {
    return Array.from(this.loadedModels.keys());
  }
}

export default AIService;