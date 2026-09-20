import { afterEach, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@vercel/blob", () => ({ get }));
import { GET } from "../../app/api/assets/[...path]/route";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("serves the four local photos without opening other private root assets", async () => {
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "isolated-test");
  get.mockImplementation(async () => ({ stream: new ReadableStream(), blob: { contentType: "image/png", size: 0, etag: "test" } }));
  for (let i = 1; i <= 4; i++) {
    const name = `Local${i}.png`;
    const response = await GET(new Request(`http://localhost/api/assets/${name}`), { params: Promise.resolve({ path: [name] }) });
    expect(response.status).toBe(200);
    expect(get).toHaveBeenLastCalledWith(name, { access: "private" });
  }
  get.mockClear();
  for (const path of [["Local5.png"], ["private.png"], ["servitec-data", "private.png"], ["Local1.jpg"]]) {
    expect((await GET(new Request("http://localhost/api/assets/test"), { params: Promise.resolve({ path }) })).status).toBe(400);
  }
  expect(get).not.toHaveBeenCalled();
});
