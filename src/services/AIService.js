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
    // Use the new workflow system for comprehensive analysis
    return await this.agentManager.runWorkflow('code-review', code, { 
      language, 
      ...options 
    });
  }

  async improveCode(code, language, issues, options = {}) {
    // Use performance optimization workflow for code improvement
    return await this.agentManager.runWorkflow('performance-optimization', code, {
      language,
      issues,
      ...options
    });
  }

  // Workflow management methods
  async runWorkflow(workflowId, input, options = {}) {
    return await this.agentManager.runWorkflow(workflowId, input, options);
  }

  async runAgent(agentId, input, options = {}) {
    return await this.agentManager.runAgent(agentId, input, options);
  }

  getAvailableWorkflows() {
    return this.agentManager.getAvailableWorkflows();
  }

  getAvailableAgents() {
    return this.agentManager.getAvailableAgents();
  }

  getExecutionHistory(executionId) {
    return this.agentManager.getExecutionHistory(executionId);
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
    this.workflows = new Map();
    this.executionHistory = new Map();
    this.initializeAgents();
    this.initializeWorkflows();
  }

  initializeAgents() {
    // Syntax Analysis Agent
    this.agents.set('syntax-analyzer', {
      name: 'Syntax Analyzer',
      description: 'Analyzes code for syntax errors, missing imports, and structural issues',
      systemPrompt: `You are a syntax analysis expert. Analyze the provided code for:
        1. Syntax errors and warnings
        2. Missing imports and dependencies
        3. Structural issues and code organization problems
        4. Language-specific best practices violations
        
        Return your analysis in this JSON format:
        {
          "issues": [
            {
              "type": "error|warning|suggestion",
              "severity": "high|medium|low",
              "line": number,
              "column": number,
              "message": "description",
              "suggestion": "how to fix"
            }
          ],
          "summary": "Overall assessment",
          "score": 0-100
        }`,
      model: 'openai-gpt4',
      temperature: 0.1,
      maxTokens: 2000
    });

    // Performance Analysis Agent
    this.agents.set('performance-analyzer', {
      name: 'Performance Analyzer',
      description: 'Identifies performance bottlenecks and suggests optimizations',
      systemPrompt: `You are a performance optimization expert. Analyze the code for:
        1. Performance bottlenecks and inefficient algorithms
        2. Memory usage issues and potential leaks
        3. Time complexity problems
        4. Optimization opportunities
        
        Return your analysis in this JSON format:
        {
          "bottlenecks": [
            {
              "type": "algorithm|memory|io|network",
              "severity": "critical|high|medium|low",
              "location": "function/method name",
              "description": "issue description",
              "impact": "performance impact",
              "suggestion": "optimization strategy"
            }
          ],
          "optimizations": [
            {
              "type": "algorithm|data_structure|caching|parallelization",
              "description": "optimization description",
              "expected_improvement": "estimated performance gain"
            }
          ],
          "score": 0-100
        }`,
      model: 'claude-3-opus',
      temperature: 0.2,
      maxTokens: 2500
    });

    // Security Analysis Agent
    this.agents.set('security-analyzer', {
      name: 'Security Analyzer',
      description: 'Identifies security vulnerabilities and unsafe practices',
      systemPrompt: `You are a security expert. Analyze the code for:
        1. Common security vulnerabilities (SQL injection, XSS, CSRF, etc.)
        2. Unsafe practices and potential attack vectors
        3. Input validation issues
        4. Authentication and authorization problems
        5. Data exposure risks
        
        Return your analysis in this JSON format:
        {
          "vulnerabilities": [
            {
              "type": "injection|xss|csrf|auth|data_exposure",
              "severity": "critical|high|medium|low",
              "location": "line/function",
              "description": "vulnerability description",
              "cve_reference": "if applicable",
              "mitigation": "how to fix"
            }
          ],
          "recommendations": [
            {
              "type": "input_validation|authentication|encryption|logging",
              "description": "security recommendation",
              "priority": "high|medium|low"
            }
          ],
          "score": 0-100
        }`,
      model: 'openai-gpt4',
      temperature: 0.1,
      maxTokens: 2000
    });

    // Code Improvement Agent
    this.agents.set('code-improver', {
      name: 'Code Improver',
      description: 'Provides improved code versions that fix identified issues',
      systemPrompt: `You are a code improvement specialist. Given code and identified issues, provide:
        1. Improved code versions that fix the issues
        2. Alternative implementations with better practices
        3. Refactoring suggestions
        4. Code quality improvements
        
        Return your response in this JSON format:
        {
          "improvements": [
            {
              "type": "bug_fix|refactor|optimization|style",
              "original_code": "original code snippet",
              "improved_code": "improved code snippet",
              "explanation": "why this improvement is better"
            }
          ],
          "suggestions": [
            {
              "type": "architecture|design_pattern|best_practice",
              "description": "suggestion description",
              "implementation": "how to implement"
            }
          ],
          "overall_quality": "assessment of overall code quality"
        }`,
      model: 'claude-3-opus',
      temperature: 0.3,
      maxTokens: 3000
    });

    // Architecture Analysis Agent
    this.agents.set('architecture-analyzer', {
      name: 'Architecture Analyzer',
      description: 'Analyzes code architecture, design patterns, and system structure',
      systemPrompt: `You are an architecture expert. Analyze the code for:
        1. Design patterns and architectural decisions
        2. Code organization and modularity
        3. Scalability and maintainability issues
        4. Technology stack appropriateness
        5. Integration patterns and dependencies
        
        Return your analysis in this JSON format:
        {
          "architecture": {
            "patterns": ["patterns identified"],
            "strengths": ["architectural strengths"],
            "weaknesses": ["architectural issues"],
            "recommendations": ["improvement suggestions"]
          },
          "modularity": {
            "score": 0-100,
            "issues": ["modularity problems"],
            "suggestions": ["modularity improvements"]
          },
          "scalability": {
            "score": 0-100,
            "concerns": ["scalability issues"],
            "strategies": ["scaling strategies"]
          }
        }`,
      model: 'claude-3-opus',
      temperature: 0.2,
      maxTokens: 2500
    });

    // Documentation Agent
    this.agents.set('documentation-agent', {
      name: 'Documentation Agent',
      description: 'Generates documentation, comments, and code explanations',
      systemPrompt: `You are a documentation expert. Analyze the code and provide:
        1. Function and class documentation
        2. Inline comments for complex logic
        3. README and API documentation
        4. Code examples and usage patterns
        
        Return your response in this JSON format:
        {
          "documentation": {
            "functions": [
              {
                "name": "function name",
                "description": "what it does",
                "parameters": ["param descriptions"],
                "returns": "return value description",
                "examples": ["usage examples"]
              }
            ],
            "classes": [
              {
                "name": "class name",
                "description": "purpose and responsibility",
                "methods": ["method documentation"],
                "properties": ["property documentation"]
              }
            ]
          },
          "comments": [
            {
              "location": "line/function",
              "comment": "suggested comment",
              "type": "explanation|warning|todo"
            }
          ],
          "readme_sections": [
            {
              "section": "section name",
              "content": "section content"
            }
          ]
        }`,
      model: 'openai-gpt4',
      temperature: 0.3,
      maxTokens: 3000
    });
  }

  initializeWorkflows() {
    // Code Review Workflow
    this.workflows.set('code-review', {
      name: 'Code Review',
      description: 'Comprehensive code analysis and improvement',
      steps: [
        { agent: 'syntax-analyzer', name: 'Syntax Analysis' },
        { agent: 'security-analyzer', name: 'Security Analysis' },
        { agent: 'performance-analyzer', name: 'Performance Analysis' },
        { agent: 'architecture-analyzer', name: 'Architecture Analysis' },
        { agent: 'code-improver', name: 'Code Improvement' }
      ],
      parallel: false
    });

    // Quick Analysis Workflow
    this.workflows.set('quick-analysis', {
      name: 'Quick Analysis',
      description: 'Fast code quality assessment',
      steps: [
        { agent: 'syntax-analyzer', name: 'Syntax Check' },
        { agent: 'security-analyzer', name: 'Security Check' }
      ],
      parallel: true
    });

    // Documentation Workflow
    this.workflows.set('documentation', {
      name: 'Documentation',
      description: 'Generate comprehensive documentation',
      steps: [
        { agent: 'architecture-analyzer', name: 'Architecture Analysis' },
        { agent: 'documentation-agent', name: 'Documentation Generation' }
      ],
      parallel: false
    });

    // Performance Optimization Workflow
    this.workflows.set('performance-optimization', {
      name: 'Performance Optimization',
      description: 'Identify and fix performance issues',
      steps: [
        { agent: 'performance-analyzer', name: 'Performance Analysis' },
        { agent: 'code-improver', name: 'Optimization Implementation' }
      ],
      parallel: false
    });
  }

  async runAgent(agentId, input, options = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      // Log execution start
      this.logExecution(executionId, agentId, 'started', { input: input.substring(0, 200) });

      // Prepare the prompt with context
      const prompt = this.buildAgentPrompt(agent, input, options);
      
      // Execute the agent using the main AI service
      const response = await this.executeAgentWithAI(agent, prompt, options);
      
      const executionTime = Date.now() - startTime;
      
      // Parse and validate response
      const result = this.parseAgentResponse(response, agentId);
      
      // Log successful execution
      this.logExecution(executionId, agentId, 'completed', {
        executionTime,
        result: result.summary || 'Analysis completed'
      });

      return {
        executionId,
        agent: agentId,
        agentName: agent.name,
        result,
        confidence: result.score ? result.score / 100 : 0.8,
        timestamp: new Date(),
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log error
      this.logExecution(executionId, agentId, 'error', {
        error: error.message,
        executionTime
      });

      throw new Error(`Agent ${agentId} execution failed: ${error.message}`);
    }
  }

  async runWorkflow(workflowId, input, options = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflowExecutionId = this.generateExecutionId();
    const startTime = Date.now();
    const results = [];
    const errors = [];

    try {
      this.logExecution(workflowExecutionId, workflowId, 'started', {
        workflow: workflow.name,
        steps: workflow.steps.length
      });

      if (workflow.parallel) {
        // Execute agents in parallel
        const promises = workflow.steps.map(async (step) => {
          try {
            return await this.runAgent(step.agent, input, options);
          } catch (error) {
            errors.push({ step: step.name, error: error.message });
            return null;
          }
        });

        const stepResults = await Promise.all(promises);
        results.push(...stepResults.filter(r => r !== null));

      } else {
        // Execute agents sequentially
        for (const step of workflow.steps) {
          try {
            const result = await this.runAgent(step.agent, input, options);
            results.push(result);
          } catch (error) {
            errors.push({ step: step.name, error: error.message });
            // Continue with next step unless critical
            if (step.agent === 'syntax-analyzer') {
              throw error; // Stop workflow if syntax analysis fails
            }
          }
        }
      }

      const workflowExecutionTime = Date.now() - startTime;
      
      // Combine results
      const combinedResult = this.combineWorkflowResults(results, workflow);
      
      this.logExecution(workflowExecutionId, workflowId, 'completed', {
        executionTime: workflowExecutionTime,
        successfulSteps: results.length,
        failedSteps: errors.length
      });

      return {
        executionId: workflowExecutionId,
        workflow: workflowId,
        workflowName: workflow.name,
        results,
        combined: combinedResult,
        errors,
        timestamp: new Date(),
        executionTime: workflowExecutionTime
      };

    } catch (error) {
      const workflowExecutionTime = Date.now() - startTime;
      
      this.logExecution(workflowExecutionId, workflowId, 'error', {
        error: error.message,
        executionTime: workflowExecutionTime
      });

      throw new Error(`Workflow ${workflowId} execution failed: ${error.message}`);
    }
  }

  async executeAgentWithAI(agent, prompt, options) {
    // Use the main AI service to execute the agent
    const messages = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: prompt }
    ];

    const aiOptions = {
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      ...options
    };

    return await this.generateResponse(prompt, aiOptions);
  }

  buildAgentPrompt(agent, input, options) {
    const context = options.context || '';
    const language = options.language || 'unknown';
    
    return `Analyze the following ${language} code:

${input}

${context ? `Additional context:\n${context}\n` : ''}

Please provide a thorough analysis following the specified format.`;
  }

  parseAgentResponse(response, agentId) {
    try {
      // Try to parse JSON response
      const content = response.response || response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to text parsing
      return {
        summary: content,
        score: 75, // Default score
        raw: content
      };
    } catch (error) {
      return {
        summary: response.response || response.content || 'Analysis completed',
        score: 75,
        raw: response.response || response.content || response,
        parseError: error.message
      };
    }
  }

  combineWorkflowResults(results, workflow) {
    const combined = {
      workflow: workflow.name,
      totalSteps: workflow.steps.length,
      completedSteps: results.length,
      summary: this.generateWorkflowSummary(results),
      recommendations: this.extractRecommendations(results),
      priority: this.prioritizeWorkflowIssues(results)
    };

    // Calculate overall score
    const scores = results.map(r => r.result.score).filter(s => s !== undefined);
    if (scores.length > 0) {
      combined.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return combined;
  }

  generateWorkflowSummary(results) {
    const summaries = results.map(r => `${r.agentName}: ${r.result.summary || 'Analysis completed'}`);
    return summaries.join('\n\n');
  }

  extractRecommendations(results) {
    const recommendations = [];
    
    results.forEach(result => {
      if (result.result.recommendations) {
        recommendations.push(...result.result.recommendations);
      }
      if (result.result.suggestions) {
        recommendations.push(...result.result.suggestions);
      }
    });

    return recommendations;
  }

  prioritizeWorkflowIssues(results) {
    const allIssues = [];
    
    results.forEach(result => {
      if (result.result.issues) {
        allIssues.push(...result.result.issues);
      }
      if (result.result.vulnerabilities) {
        allIssues.push(...result.result.vulnerabilities);
      }
      if (result.result.bottlenecks) {
        allIssues.push(...result.result.bottlenecks);
      }
    });

    return allIssues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logExecution(executionId, agentId, status, data) {
    const logEntry = {
      executionId,
      agentId,
      status,
      timestamp: new Date(),
      ...data
    };

    if (!this.executionHistory.has(executionId)) {
      this.executionHistory.set(executionId, []);
    }
    
    this.executionHistory.get(executionId).push(logEntry);
    
    // Keep only last 1000 entries per execution
    if (this.executionHistory.get(executionId).length > 1000) {
      this.executionHistory.get(executionId).shift();
    }
  }

  getExecutionHistory(executionId) {
    return this.executionHistory.get(executionId) || [];
  }

  getAvailableAgents() {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      name: agent.name,
      description: agent.description
    }));
  }

  getAvailableWorkflows() {
    return Array.from(this.workflows.entries()).map(([id, workflow]) => ({
      id,
      name: workflow.name,
      description: workflow.description,
      steps: workflow.steps
    }));
  }

  // Legacy method for backward compatibility
  combineAnalysisResults(results) {
    return this.combineWorkflowResults(results, { name: 'Legacy Analysis' });
  }

  generateSummary(results) {
    return this.generateWorkflowSummary(results);
  }

  prioritizeIssues(results) {
    return this.prioritizeWorkflowIssues(results);
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