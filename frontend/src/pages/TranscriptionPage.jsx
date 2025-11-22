import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, FileText, FileCheck, RotateCcw, Download, Eye, FileAudio } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = '/api';

function TranscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeStr, setEstimatedTimeStr] = useState("");
  const progressIntervalRef = useRef(null);
  const [isComplete, setIsComplete] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const initialState = {
    projeto: '', coordenador: '', data: new Date().toISOString().split('T')[0],
    local: '', formato: 'Áudio', entrevistadores: '', outros: '',
    duracao: '', docs_coletados: '', docs_reproduzidos: '', obs: '',
    entrevistado: '', resumo: ''
  };
  const [formData, setFormData] = useState(initialState);
  const [tags, setTags] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleReset = () => {
    setFormData(initialState); setTags([]); setFile(null);
    setIsComplete(false); setResultBlob(null); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Limpo para nova transcrição.");
  };

  const startSimulatedProgress = (fileSize) => {
    setProgress(0); clearInterval(progressIntervalRef.current);
    const sizeInMB = fileSize / (1024 * 1024);
    const estimatedTotalSeconds = Math.max(20, Math.ceil(sizeInMB * 15));
    const minutes = Math.floor(estimatedTotalSeconds / 60);
    const seconds = estimatedTotalSeconds % 60;
    setEstimatedTimeStr(`${minutes}m ${seconds}s`);
    const increment = 100 / ((estimatedTotalSeconds * 1000) / 500);
    progressIntervalRef.current = setInterval(() => {
        setProgress(prev => (prev + increment >= 95 ? 95 : prev + increment));
    }, 500);
  };

  const handleSubmit = async () => {
    if (!file || !formData.entrevistado) { toast.error("Preencha o nome e anexe arquivo."); return; }
    setLoading(true); setIsComplete(false); startSimulatedProgress(file.size);
    toast.loading('Enviando...', { id: 'transcribingBtn' });
    const data = new FormData();
    data.append('file', file);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('tags', tags.join(', '));

    try {
      const response = await axios.post(`${API_URL}/transcrever`, data, { responseType: 'blob', timeout: 900000 });
      clearInterval(progressIntervalRef.current); setProgress(100);
      setResultBlob(response.data); setIsComplete(true);
      toast.dismiss('transcribingBtn'); toast.success("Concluído!");
    } catch (error) {
      clearInterval(progressIntervalRef.current); setProgress(0);
      toast.dismiss('transcribingBtn'); toast.error("Erro ao processar.");
    } finally { setLoading(false); clearInterval(progressIntervalRef.current); }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = window.URL.createObjectURL(new Blob([resultBlob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transcricao_${formData.entrevistado.replace(/\s+/g, '_')}.docx`);
    document.body.appendChild(link); link.click(); link.remove();
  };
return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* --- COLUNA ESQUERDA: METADADOS (7 colunas) --- */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <h2 className="text-xl font-serif font-bold text-cmurb-vinho dark:text-cmurb-laranja mb-8 border-b border-gray-100 dark:border-gray-700 pb-4 flex items-center gap-2">
            <FileText className="text-cmurb-laranja" size={24}/> Metadados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Título do Projeto" id="projeto" val={formData.projeto} change={handleInputChange} span="2" />
            <Input label="Coordenador(es)" id="coordenador" val={formData.coordenador} change={handleInputChange} span="2" />

            <Input label="Data da Entrevista" id="data" type="date" val={formData.data} change={handleInputChange} />
            <Input label="Local" id="local" val={formData.local} change={handleInputChange} />

            <div className="col-span-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
              <label className="label-modern">Formato de Gravação</label>
              <div className="flex gap-6 mt-3">
                {['Áudio', 'Vídeo'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${formData.formato === opt ? 'border-cmurb-laranja' : 'border-gray-300 dark:border-gray-500'}`}>
                      {formData.formato === opt && <div className="w-2.5 h-2.5 rounded-full bg-cmurb-laranja" />}
                    </div>
                    <input
                      type="radio" name="formato" value={opt} className="hidden"
                      checked={formData.formato === opt}
                      onChange={(e) => setFormData({...formData, formato: e.target.value})}
                    />
                    <span className={`text-sm font-medium transition ${formData.formato === opt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input label="Entrevistador(es)" id="entrevistadores" val={formData.entrevistadores} change={handleInputChange} />
            <Input label="Entrevistado(a) *" id="entrevistado" val={formData.entrevistado} change={handleInputChange} required={true} />

            <Input label="Outros Participantes" id="outros" val={formData.outros} change={handleInputChange} ph="Se aplicável" />
            <Input label="Duração Estimada" id="duracao" ph="Ex: 01:30:00" val={formData.duracao} change={handleInputChange} />
<TextArea label="Docs Coletados" id="docs_coletados" val={formData.docs_coletados} change={handleInputChange} />
            <TextArea label="Docs Reproduzidos" id="docs_reproduzidos" val={formData.docs_reproduzidos} change={handleInputChange} />
            <TextArea label="Observações" id="obs" val={formData.obs} change={handleInputChange} h="h-32"/>
          </div>
        </div>
      </div>

      {/* --- COLUNA DIREITA --- */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <h2 className="text-xl font-serif font-bold text-cmurb-vinho dark:text-cmurb-laranja mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">Conteúdo</h2>
          <div className="space-y-6">
            <div>
              <label className="label-modern" htmlFor="resumo">Resumo Temático</label>
              <textarea id="resumo" value={formData.resumo} onChange={handleInputChange} className="input-modern h-40 resize-none" placeholder="Descreva o tema..."/>
            </div>
            <div>
              <label className="label-modern">Tags</label>
              <TagInput tags={tags} setTags={setTags} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-28 z-10 transition-colors">
          <h2 className="text-xl font-serif font-bold text-cmurb-vinho dark:text-cmurb-laranja mb-6">Processamento</h2>

          {!isComplete && (
             <div className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer group ${file ? 'border-cmurb-vinho bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-cmurb-laranja'}`}>
                <input type="file" ref={fileInputRef} id="audio-file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".mp3,.wav,.m4a,.mp4,.mpeg,.ogg" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
                <div className="flex flex-col items-center pointer-events-none">
                {file ? (
                    <>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm mb-3"><FileAudio className="w-8 h-8 text-cmurb-vinho dark:text-cmurb-laranja" /></div>
                    <span className="text-cmurb-vinho dark:text-gray-200 font-bold text-sm break-all">{file.name}</span>
                    <span className="text-xs text-gray-500 mt-1 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </>
                ) : (
                    <>
                    <Upload className="w-10 h-10 text-gray-400 group-hover:text-cmurb-laranja mb-4 transition-colors" />
                    <span className="text-gray-600 dark:text-gray-300 font-bold text-sm">Carregar Arquivo</span>
                    </>
                )}
                </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase"><span>Processando...</span><span>~{estimatedTimeStr}</span></div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-cmurb-laranja h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">{Math.floor(progress)}% (Simulado)</p>
            </div>
          )}

          {!isComplete ? (
            <button onClick={handleSubmit} disabled={loading || !file} className="w-full btn-primary mt-6 py-4 text-sm tracking-wide flex justify-center items-center gap-2">
                {loading ? 'PROCESSANDO...' : 'INICIAR'}
            </button>
          ) : (
            <div className="mt-6 space-y-4 animate-fadeIn">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-lg flex items-center gap-3 text-green-800 dark:text-green-300">
                    <FileCheck size={24} /> <div><p className="font-bold">Pronto!</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowPreviewModal(true)} className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-200 transition"><Eye size={18} /> Prévia</button>
                    <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-cmurb-vinho text-white font-bold py-3 rounded-lg hover:bg-cmurb-vinhoDark transition"><Download size={18} /> Baixar</button>
                </div>
                <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-lg hover:text-cmurb-laranja transition mt-2"><RotateCcw size={18} /> Nova Transcrição</button>
            </div>
          )}
        </div>
      </div>

       {showPreviewModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                        <h3 className="text-lg font-bold text-cmurb-vinho dark:text-cmurb-laranja">Prévia</h3>
                        <button onClick={() => setShowPreviewModal(false)}><X /></button>
                    </div>
                    <div className="flex-grow overflow-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">O arquivo DOCX foi gerado. Baixe para visualizar o conteúdo completo.</p>
                    </div>
                    <div className="mt-4 flex justify-end"><button onClick={handleDownload} className="btn-primary flex items-center gap-2 py-2 px-4"><Download size={16} /> Baixar</button></div>
                </div>
            </div>
        )}
    </div>
  );
}
const Input = ({ label, id, val, change, type="text", ph="", span="1", required=false }) => (
  <div className={`col-span-${span} sm:col-span-${span}`}>
    <label className="label-modern" htmlFor={id}>{label} {required && <span className="text-red-500">*</span>}</label>
    <input type={type} id={id} value={val} onChange={change} placeholder={ph} className="input-modern"/>
  </div>
);

const TextArea = ({ label, id, val, change, ph="", h="h-24" }) => (
  <div className="col-span-2">
    <label className="label-modern" htmlFor={id}>{label}</label>
    <textarea id={id} value={val} onChange={change} placeholder={ph} className={`input-modern ${h} resize-none`}/>
  </div>
);

function TagInput({ tags, setTags }) {
  const [input, setInput] = useState("");
  const addTag = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) setTags([...tags, input.trim()]);
      setInput("");
    }
  };
  return (
    <div className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-800 transition">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="bg-orange-50 dark:bg-orange-900/30 text-cmurb-vinho dark:text-orange-300 px-2 py-1 rounded text-xs flex items-center gap-1 border border-orange-100 font-bold">
            {tag} <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => setTags(tags.filter(t => t !== tag))} />
          </span>
        ))}
      </div>
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={addTag} className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-200" placeholder={tags.length===0?"Enter para adicionar...":"Mais..."}/>
    </div>
  );
}

export default TranscriptionPage;

