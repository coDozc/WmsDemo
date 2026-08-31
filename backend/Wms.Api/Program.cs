using Microsoft.EntityFrameworkCore;
using Wms.Api.Data;
using Wms.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddDbContext<WmsDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("WmsDatabase")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
