import React, { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  CircularProgress,
  useTheme,
  alpha,
  Avatar,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ServerHealth {
  status: string;
  uptime: number;
}

interface GenerateParams {
  text: string;
  // max_length: number;
  // temperature: number;
  // top_p: number;
  // num_return_sequences: number;
}

interface GenerateResponse {
  question: string;
  passage: string;
  options: string;
  answer: number;
  explanation: string;
}

function App() {
  const serverUrl = 'http://172.30.1.27:8001';
  // const serverUrl = 'http://localhost:8001';

  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${serverUrl}/health`);
      console.log(response.data);
      setHealth(response.data);
    } catch (error) {
      console.error('서버 상태 확인 실패:', error);
      setHealth({ status: 'error', uptime: 0 });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const generateParams: GenerateParams = {
        text: currentInput,
      };

      console.log('요청 데이터:', generateParams);
      const response = await axios.post<any>(`${serverUrl}/generate`, generateParams, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('서버 응답:', response.data);

      const generatedText = response.data;
      if (!generatedText) {
        throw new Error('생성된 텍스트가 없습니다.');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: JSON.stringify(generatedText),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error 
          ? `오류가 발생했습니다: ${error.message}`
          : '메시지를 처리하는 중 오류가 발생했습니다.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.12)} 0%, transparent 60%),
                  radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.12)} 0%, transparent 60%)`,
      overflow: 'hidden'
    }}>
      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 1,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
            height: '100%'
          }}
        >
          {/* 헤더 */}
          <Box sx={{ 
            flexShrink: 0,
            p: 1.5, 
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            background: `linear-gradient(90deg, 
              ${alpha(theme.palette.primary.main, 0.95)} 0%, 
              ${alpha(theme.palette.primary.dark, 0.95)} 100%)`,
            color: 'white',
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600,
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75
            }}>
              <SmartToyIcon sx={{ fontSize: 20 }} />
              AI 채팅
            </Typography>
            <Tooltip 
              title={health?.status === 'healthy' ? '서버 정상 작동 중' : '서버 연결 오류'}
              arrow
              placement="right"
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 0.25,
                  color: health?.status === 'healthy' ? 'success.light' : 'error.light',
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1
                  }
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 4, 
                    height: 4, 
                    borderRadius: '50%',
                    bgcolor: health?.status === 'healthy' ? 'success.light' : 'error.light',
                    display: 'inline-block',
                    boxShadow: `0 0 6px ${health?.status === 'healthy' ? theme.palette.success.light : theme.palette.error.light}`
                  }} 
                />
                {health?.status === 'healthy' ? '서버 정상' : '서버 오류'}
                {health?.uptime && ` (${Math.floor(health.uptime / 60)}분)`}
              </Typography>
            </Tooltip>
          </Box>

          {/* 메시지 영역 */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            background: `linear-gradient(180deg, 
              ${alpha(theme.palette.background.paper, 0.8)} 0%, 
              ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.primary.main, 0.2),
              borderRadius: '3px',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.3),
              },
            },
            minHeight: 0
          }}>
            {messages.map((message, index) => {
              let parsed: GenerateResponse | null = null;
              if (message.role === 'assistant') {
                try {
                  if (typeof message.content === 'object') {
                    parsed = message.content as GenerateResponse;
                  } else if (typeof message.content === 'string') {
                    const obj = JSON.parse(message.content);
                    if (
                      obj &&
                      typeof obj === 'object' &&
                      'question' in obj &&
                      'passage' in obj &&
                      'options' in obj &&
                      'answer' in obj &&
                      'explanation' in obj
                    ) {
                      parsed = obj as GenerateResponse;
                    }
                  }
                } catch {}
              }

              return (
                <Zoom in={true} key={index} style={{ transitionDelay: `${index * 30}ms` }}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      animation: 'fadeIn 0.2s ease-out',
                      '@keyframes fadeIn': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(8px)',
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                  >
                    {message.role === 'assistant' && (
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.9),
                          width: 28,
                          height: 28,
                          boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                      >
                        <SmartToyIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                    <Box>
                      <Box
                        sx={{
                          bgcolor: message.role === 'user' 
                            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                            : alpha(theme.palette.grey[50], 0.8),
                          color: message.role === 'user' ? 'black' : 'text.primary',
                          p: 1.5,
                          borderRadius: 2,
                          boxShadow: message.role === 'user'
                            ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                            : `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                          position: 'relative',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid',
                          borderColor: message.role === 'user'
                            ? alpha(theme.palette.primary.main, 0.2)
                            : alpha(theme.palette.divider, 0.1),
                        }}
                      >
                        {parsed ? (
                          <Fragment>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                              {parsed.question}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                              <b>지문:</b> {parsed.passage}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <b>선택지:</b> {parsed.options.split('//').map((opt, i) => (
                                <span key={i} style={{
                                  background: i + 1 === parsed!.answer ? alpha(theme.palette.primary.main, 0.15) : undefined,
                                  fontWeight: i + 1 === parsed!.answer ? 700 : 400,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  marginRight: 4
                                }}>
                                  {String.fromCharCode(65 + i)}. {opt}
                                </span>
                              ))}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <b>정답:</b> {String.fromCharCode(64 + parsed.answer)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              <b>해설:</b> {parsed.explanation}
                            </Typography>
                          </Fragment>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.5,
                              letterSpacing: '-0.1px',
                              wordBreak: 'break-word'
                            }}
                          >
                            {message.content || ' '}
                          </Typography>
                        )}
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 0.25,
                          color: 'text.secondary',
                          textAlign: message.role === 'user' ? 'right' : 'left',
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                      >
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Box>
                    {message.role === 'user' && (
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.9),
                          width: 28,
                          height: 28,
                          boxShadow: `0 2px 6px ${alpha(theme.palette.secondary.main, 0.3)}`
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                  </Box>
                </Zoom>
              );
            })}
            {isLoading && (
              <Fade in={true}>
                <Box sx={{ 
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  bgcolor: alpha(theme.palette.grey[50], 0.8),
                  borderRadius: 2,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.1),
                }}>
                  <CircularProgress size={16} thickness={4} />
                  <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                    응답 생성 중...
                  </Typography>
                </Box>
              </Fade>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* 입력 영역 */}
          <Box sx={{ 
            flexShrink: 0,
            p: 1.5, 
            borderTop: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)'
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: 1,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.1),
              transition: 'all 0.2s',
              '&:focus-within': {
                boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                borderColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="메시지를 입력하세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isLoading}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiInputBase-root': {
                    px: 1.5,
                    fontSize: '0.875rem',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottom: 'none',
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottom: 'none',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottom: 'none',
                  }
                }}
              />
              <IconButton 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 32,
                  height: 32,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'scale(1.05)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(theme.palette.action.disabled, 0.1),
                    color: theme.palette.action.disabled,
                  }
                }}
              >
                <SendIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App; 