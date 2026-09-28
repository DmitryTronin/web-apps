#!/usr/bin/env node
'use strict';

const readline = require('node:readline');

const fixtureTool = {
  name: 'get_web_apps_fixture_marker',
  description: 'Returns the unique AIAE-441 web-apps fixture marker.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
};

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function handleMessage(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    writeMessage({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    });
    return;
  }

  if (!message || typeof message !== 'object' || Array.isArray(message) || message.jsonrpc !== '2.0') {
    writeMessage({
      jsonrpc: '2.0',
      id: message && message.id !== undefined ? message.id : null,
      error: { code: -32600, message: 'Invalid Request' },
    });
    return;
  }

  const { id, method, params = {} } = message;
  if (typeof method !== 'string') {
    if (id !== undefined) {
      writeMessage({
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request' },
      });
    }
    return;
  }

  let result;
  switch (method) {
    case 'initialize':
      result = {
        protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'aiae441-web-apps-fixture', version: '1.0.0' },
      };
      break;
    case 'ping':
      result = {};
      break;
    case 'tools/list':
      result = { tools: [fixtureTool] };
      break;
    case 'tools/call':
      if (params.name !== fixtureTool.name) {
        result = {
          content: [{ type: 'text', text: `Unknown tool: ${String(params.name)}` }],
          isError: true,
        };
      } else {
        result = {
          content: [{ type: 'text', text: 'WEB_APPS_MCP_LOADED' }],
          isError: false,
        };
      }
      break;
    default:
      if (id !== undefined) {
        writeMessage({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found' },
        });
      }
      return;
  }

  if (id !== undefined) {
    writeMessage({ jsonrpc: '2.0', id, result });
  }
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', handleMessage);
