import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.split('\n')[0]));
page.on('console', (m) => { if (m.type() === 'error' && !/401|Failed to load resource/i.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0,180)); });

// O preview nao tem sessao logada e a RLS exige usuario autenticado, entao a
// lista volta vazia. Aqui simulamos a resposta do banco para testar a TELA
// com dados realistas (as linhas reais ja existem na tabela).
const linhas = [
  { id: '1', slug: 'normas', title: 'Normas da Empresa', sort_order: 10, updated_at: '2026-10-01T12:00:00Z',
    content: 'REGULAMENTO INTERNO ÉTTO PROPAGANDA\nNORMAS DA EMPRESA\n\n1 - DA POSTURA NO AMBIENTE DE TRABALHO:\ni. Acatar e cumprir instruções e ordens de seus superiores;\nii. Observar e zelar pelo cumprimento deste regulamento;\n\nII - DOS HORÁRIOS DE TRABALHO\ni. Início às 08:00, almoço 12:00 às 13:15, saída às 18:00.' },
  { id: '2', slug: 'medidas', title: 'Medidas', content: '', sort_order: 20, updated_at: '2026-10-01T12:00:00Z' },
  { id: '3', slug: 'materia-prima', title: 'Matéria-prima', content: 'Lona 440g — rolo 3,20m\nACM 3mm — chapa 1,22 x 3,00m', sort_order: 30, updated_at: '2026-10-01T12:00:00Z' },
  { id: '4', slug: 'prazos', title: 'Prazos de Serviço', content: 'Entrega em 7 dias úteis após aprovação de arte e pagamento.', sort_order: 40, updated_at: '2026-10-01T12:00:00Z' },
];
await page.route('**/rest/v1/guide_sections*', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(linhas) })
);

await page.goto('http://localhost:8080/dev-preview.html?guia=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const abas = await page.getByRole('tab').allInnerTexts();
console.log('abas:', JSON.stringify(abas));
console.log('conteudo da 1a aba visivel:', (await page.locator('.whitespace-pre-wrap').first().innerText().catch(()=>'')).slice(0,60).replace(/\n/g,' / '));
await page.screenshot({ path: '.playwright/guia/com-dados.png', fullPage: true });

// aba vazia -> empty state
await page.getByRole('tab', { name: 'Medidas' }).click();
await page.waitForTimeout(400);
const vazio = await page.getByText(/Nenhum conteúdo ainda/).count();
console.log('empty state na aba sem conteudo:', vazio > 0 ? 'OK' : 'FALTOU');

// modo edicao
await page.getByRole('button', { name: /Editar/ }).click();
await page.waitForTimeout(400);
console.log('textarea no modo edicao:', await page.locator('textarea').count() > 0 ? 'OK' : 'FALTOU');
console.log('campo de nome da aba:', await page.locator('#guia-titulo').count() > 0 ? 'OK' : 'FALTOU');
console.log('abas bloqueadas durante edicao:', await page.getByRole('tab', { name: 'Normas da Empresa' }).isDisabled() ? 'OK' : 'NAO');
await page.screenshot({ path: '.playwright/guia/edicao-dados.png', fullPage: true });

console.log(errors.length ? 'ERROS: ' + [...new Set(errors)].slice(0,4).join(' | ') : 'sem erros de console');
await browser.close();
