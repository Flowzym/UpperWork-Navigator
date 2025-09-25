import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadChunksCached, loadStats } from '../../src/lib/cache/ragCache';
import * as idb from '../../src/lib/storage/idb';

// Mock IndexedDB functions
vi.mock('../../src/lib/storage/idb', () => ({
  idbGet: vi.fn(),
  idbSet: vi.fn(),
  idbKeys: vi.fn(),
  idbDel: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('ragCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('caches chunks by buildId', async () => {
    const mockChunks = [{"programId":"P1","text":"test chunk"}];
    
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockChunks), {status:200}));
    vi.mocked(idb.idbGet).mockResolvedValue(undefined);
    const setSpy = vi.mocked(idb.idbSet).mockResolvedValue();
    vi.mocked(idb.idbKeys).mockResolvedValue([]);
    
    const { chunks, source } = await loadChunksCached({ buildId:'123', totalChunks: 1, totalPages: 1, programsFound: 1 });
    
    expect(chunks).toHaveLength(1);
    expect(source).toBe('network');
    expect(setSpy).toHaveBeenCalledWith('rag:chunks:123', JSON.stringify(mockChunks));
  });

  it('returns cached chunks when available', async () => {
    const cachedData = JSON.stringify([{"programId":"P1","text":"cached chunk"}]);
    
    vi.mocked(idb.idbGet).mockResolvedValue(cachedData);
    
    const { chunks, source } = await loadChunksCached({ buildId:'123', totalChunks: 1, totalPages: 1, programsFound: 1 });
    
    expect(chunks).toHaveLength(1);
    expect(source).toBe('idb');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('cleans up old cache versions', async () => {
    const mockChunks = [{"programId":"P1","text":"test"}];
    
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockChunks), {status:200}));
    vi.mocked(idb.idbGet).mockResolvedValue(undefined);
    vi.mocked(idb.idbSet).mockResolvedValue();
    vi.mocked(idb.idbKeys).mockResolvedValue(['rag:chunks:old1', 'rag:chunks:old2', 'other:key']);
    const delSpy = vi.mocked(idb.idbDel).mockResolvedValue();
    
    await loadChunksCached({ buildId:'new', totalChunks: 1, totalPages: 1, programsFound: 1 });
    
    expect(delSpy).toHaveBeenCalledWith('rag:chunks:old1');
    expect(delSpy).toHaveBeenCalledWith('rag:chunks:old2');
    expect(delSpy).not.toHaveBeenCalledWith('other:key');
  });

  it('loads stats from network', async () => {
    const mockStats = { totalChunks: 50, totalPages: 48, programsFound: 6 };
    
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockStats), {status:200}));
    
    const stats = await loadStats();
    
    expect(stats).toMatchObject(mockStats);
    expect(stats?.buildId).toBe('50-48-6'); // Generated buildId
  });

  it('handles missing stats gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', {status:404}));
    
    const stats = await loadStats();
    
    expect(stats).toBeUndefined();
  });
});