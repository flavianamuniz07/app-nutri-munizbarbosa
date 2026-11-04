import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração de CORS se necessário
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'Chave GEMINI_API_KEY não configurada no ambiente do servidor.',
    })
  }

  try {
    const { dados_do_paciente } = req.body || {}

    if (!dados_do_paciente || typeof dados_do_paciente !== 'string' || dados_do_paciente.trim() === '') {
      return res.status(400).json({ error: 'Parâmetro dados_do_paciente é obrigatório.' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Esquema estruturado JSON garantido
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        plano_semanal: {
          type: SchemaType.ARRAY,
          description: 'Lista com o cardápio dos dias da semana',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              dia: {
                type: SchemaType.STRING,
                description: 'Nome do dia da semana (ex: Segunda-feira)',
              },
              refeicoes: {
                type: SchemaType.OBJECT,
                properties: {
                  cafe_da_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções para o café da manhã',
                  },
                  lanche_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções para o lanche da manhã',
                  },
                  almoco: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções para o almoço',
                  },
                  lanche_tarde: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções para o lanche da tarde',
                  },
                  jantar: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções para o jantar',
                  },
                },
                required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
              },
            },
            required: ['dia', 'refeicoes'],
          },
        },
      },
      required: ['plano_semanal'],
    }

    // Configuração com structured outputs estritos
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
      },
    })

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dados_do_paciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let jsonResult: any
    try {
      jsonResult = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Falha no JSON.parse da resposta do Gemini:', parseError, responseText)
      return res.status(500).json({
        error: 'A IA retornou um formato inesperado. Tente novamente ou crie manualmente.',
      })
    }

    return res.status(200).json(jsonResult)
  } catch (error: any) {
    console.error('Erro na geração com Gemini:', error)
    return res.status(500).json({
      error: error.message || 'Erro ao gerar o plano alimentar via IA.',
    })
  }
}

