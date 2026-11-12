"""Optional adapter: mount these routes in the existing BioIndex FastAPI app."""
import inspect

from fastapi import APIRouter, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from .core import CarrierAPI

HEADERS = {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"}


def create_router(database, authorize_request):
    """authorize_request(request, gene) must synchronously check existing access."""
    if not callable(authorize_request) or inspect.iscoroutinefunction(authorize_request):
        raise TypeError("Supply the backend's existing authorization callback")
    api = CarrierAPI(database)
    router = APIRouter()

    def respond(request, body, path):
        def check_access(gene):
            decision = authorize_request(request, gene)
            if inspect.isawaitable(decision):
                if inspect.iscoroutine(decision):
                    decision.close()
                raise TypeError("The authorization callback must be synchronous")
            return decision is True
        status, result = api.handle(request.method, path,
                                    dict(request.query_params), body,
                                    check_access)
        return JSONResponse(result, status_code=status, headers=HEADERS)

    @router.get("/__gene_carrier_summary__")
    def gene_summary(request: Request):
        return respond(request, None, "/__gene_carrier_summary__")

    @router.get("/__gene_locus_filter__")
    def locus_filter(request: Request):
        return respond(request, None, "/__gene_locus_filter__")

    @router.post("/__gene_carrier_demographics__")
    async def selected_demographics(request: Request):
        import json
        chunks = bytearray()
        async for chunk in request.stream():
            chunks.extend(chunk)
            if len(chunks) > 1024 * 1024:
                return JSONResponse({"error": "Request body is too large"}, status_code=413, headers=HEADERS)
        try:
            body = json.loads(chunks)
        except (ValueError, UnicodeError):
            return JSONResponse({"error": "Invalid JSON request"}, status_code=400, headers=HEADERS)
        return await run_in_threadpool(respond, request, body, "/__gene_carrier_demographics__")

    return router
