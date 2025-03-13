package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// Estruturas de dados que espelham as do Flask
type Chamado struct {
	ID           int       `json:"id"`
	Titulo       string    `json:"titulo"`
	Descricao    string    `json:"descricao"`
	Status       string    `json:"status"`
	Criticidade  string    `json:"criticidade"`
	DataCriacao  time.Time `json:"data_criacao"`
	AutorID      int       `json:"autor_id"`
	AutorNome    string    `json:"autor_nome,omitempty"`
}

type SearchResult struct {
	Chamados []Chamado `json:"chamados"`
	Total    int       `json:"total"`
}

// Mock de banco de dados para teste inicial
var chamadosMock = []Chamado{
	{ID: 1, Titulo: "Problema com impressora", Descricao: "A impressora não está funcionando", Status: "Aberto", Criticidade: "Média", DataCriacao: time.Now(), AutorID: 1},
	{ID: 2, Titulo: "Erro no sistema de login", Descricao: "Usuários não conseguem fazer login", Status: "Em andamento", Criticidade: "Alta", DataCriacao: time.Now(), AutorID: 2},
	{ID: 3, Titulo: "Solicitação de novo equipamento", Descricao: "Precisamos de novos monitores", Status: "Aberto", Criticidade: "Baixa", DataCriacao: time.Now(), AutorID: 1},
}

func main() {
	// Configuração de rotas
	http.HandleFunc("/api/search", searchHandler)
	http.HandleFunc("/api/health", healthCheckHandler)

	// Inicializando o servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	
	log.Printf("Servidor de busca iniciado na porta %s", port)
	log.Printf("Acesse http://localhost:%s/api/health para verificar o status", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// Handler para busca
func searchHandler(w http.ResponseWriter, r *http.Request) {
	// Configurando CORS para permitir requisições do frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Extrai parâmetros da query
	query := r.URL.Query().Get("q")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	
	// Log para depuração
	log.Printf("Busca recebida: %s (página %d)", query, page)

	// Simulação de busca em Elastic Search (será substituída pela implementação real)
	result := searchChamados(query, page)
	
	// Retornando resultado como JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Health check
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	response := map[string]string{
		"status": "ok",
		"message": "API de busca funcionando normalmente",
		"timestamp": time.Now().Format(time.RFC3339),
	}
	
	json.NewEncoder(w).Encode(response)
}

// Função que simula busca no Elasticsearch (será implementada com o cliente real)
func searchChamados(query string, page int) SearchResult {
	// Simulação de resultado de busca
	var result SearchResult
	
	// Filtragem básica (para demonstração)
	for _, chamado := range chamadosMock {
		// Busca simples por título ou descrição
		if query == "" || contains(chamado.Titulo, query) || contains(chamado.Descricao, query) {
			result.Chamados = append(result.Chamados, chamado)
		}
	}
	
	result.Total = len(result.Chamados)
	return result
}

// Função auxiliar para verificar se uma string contém outra (case-insensitive)
func contains(s, substr string) bool {
	s, substr = strings.ToLower(s), strings.ToLower(substr)
	return strings.Contains(s, substr)
}
