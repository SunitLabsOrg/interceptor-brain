using Microsoft.AspNetCore.Mvc;

namespace Orders.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    [HttpPost]
    public IActionResult Create([FromBody] CreateOrderRequest request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest("Amount must be positive");
        }

        return Ok(new
        {
            status = "created",
            orderId = request.OrderId
        });
    }
}

public sealed class CreateOrderRequest
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
