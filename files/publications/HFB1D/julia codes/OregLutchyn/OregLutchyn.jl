begin
    using Quantica
    using Parameters
    using ProgressMeter
    using LinearAlgebra
    using LinearMaps
    using ArnoldiMethod
    using Statistics
    using CairoMakie
    CairoMakie.activate!(type = "png")
    path = "/home/lobo/GitHub/franciscolobo1880.github.io/files/publications/HFB1D/suplementary/julia/OregLutchyn/"
end;

using CairoMakie

fig = Figure()

# Create a heatmap
ax, hm = heatmap(fig[1, 1], rand(10, 10))

# Create a horizontal colorbar
cb_grid = fig[2, 1] = GridLayout(tellwidth=false) # Nest a grid layout for better control
cb = Colorbar(cb_grid[1, 1], hm, vertical=false)  # Add the colorbar
Label(cb_grid[1, 2], "Title on Right", rotation=90, valign=:center, halign=:center) # Add title

fig


# ----- Building Oreg-Lutchyn's Majorana nanowire -----
begin
    const ħ2ome = 76.2 # meV
    const σ0τz = @SMatrix[1 0 0 0; 0 1 0 0; 0 0 -1 0; 0 0 0 -1]
    const σyτy = @SMatrix[0 0 0 -1; 0 0 1 0; 0 1 0 0; -1 0 0 0]
    const σyτz = @SMatrix[0 -im 0 0; im 0 0 0; 0 0 0 im; 0 0 -im 0]
    const σzτz = @SMatrix[1 0 0 0; 0 -1 0 0; 0 0 -1 0; 0 0 0 1]
end

@with_kw struct Params @deftype Float64
    L  = Inf    # nm
    a0 = 10.0   # nm
    m0 = 0.023  # InAs
end

build_OregLutchyn_wire(; kw...) = build_OregLutchyn_wire(Params(; kw...))
function build_OregLutchyn_wire(p::Params)
    @unpack L, a0, m0 = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)

    lat = LP.linear(; a0)

    modelN = @onsite((; μ=0.0, Vz=0.0) -> (2*t-μ)*σ0τz + Vz*σzτz) - hopping(t*σ0τz)
    modelS = @onsite((; Δ0=0.0) -> Δ0*σyτy)
    modelSOC = @hopping((r, dr; α=0.0) -> α*(im*dr[1]/(2a0^2))*σyτz)
    model = modelN + modelSOC + modelS

    h = lat |> hamiltonian(model, orbitals=4)

    if isfinite(L) h=supercell(h, region = r -> 0 <= r[1] <= L) end

    return h
end

# ----- Calculating band structure, band gap, band spectrum and Pfaffian -----
begin
    hinf = build_OregLutchyn_wire(L=Inf)
    hfin = build_OregLutchyn_wire(L=2000.0)
    Pfaffian(μ, Δ0) = sqrt(μ^2+Δ0^2)
    
    
    ks  = subdiv(-π, π, 1000)
    Vzs = range(0.0, 1.5, 100)
    μs  = range(-2.5, 2.5, 100) 
    params = (; α=40.0, Δ0=0.5, μ=0.0, Vz=0.0)
end

# ----- Plotting phase diagram and spectrum -----
begin
    fig = Figure(size=(900, 700))

    # - band gap phase diagram -
    Ωfin = [abs.(real.(energies(spectrum(hfin(;params..., α=10.0, Vz, μ); solver=ES.ShiftInvert(ES.ArnoldiMethod(nev = 1), 0)))))[1] for Vz in Vzs, μ in μs]
    #Ωinf = [Quantica.gap(hinf(; params..., Vz, μ)) for Vz in Vzs, μ in μs]
    ax = Axis(fig[1, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ\ \text{(meV)}", titlesize=22.5, xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true)
    hm = heatmap!(ax, Vzs, μs, Ωfin, colormap=cgrad(:inferno), colorrange=(0,0.401), highclip=cgrad(:inferno)[end])    
    bar = Colorbar(fig[0, 1], hm, vertical=false, label=L"Ω\text{ (meV)}", labelsize=22.5)    
    lines!(Pfaffian.(μs, params.Δ0), μs, color=:white, linestyle=:dash) 
    xlims!(Vzs[begin], Vzs[end])

    # - band spectrum -
    BSP = bands(hfin, Vzs; mapping=Vz -> ftuple(;params..., α=10.0, Vz), solver=ES.ShiftInvert(ES.ArnoldiMethod(nev = 50), 0))
    ax = Axis(fig[1, 2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"ϵ\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xgridvisible=false, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true, yminorgridvisible=true)
    qplot!(BSP, color=:black, hide=:nodes)
    ylims!(-0.60, 0.60)
    xlims!(Vzs[begin], Vzs[end])
    
    rowsize!(fig.layout, 1, Aspect(1, 1.0))
    resize_to_layout!(fig)
    display(fig)
    #save(path*"PD_BSP.png", fig)
end

# ----- Plotting band structure -----
begin
    BTS = bands(hinf(;params..., Vz=0.5), ks)
    fig = Figure(size=(600,500))
    ax = Axis(fig[1,1], ylabel=L"ϵ\text{ (meV)}", xlabel=L"k \text{ (nm)}^{-1}", xlabelsize=20, ylabelsize=20, xticks=([-π, -π/2, 0, π/2, π], ["-π", "-π/2", "0", "π/2", "π"]), yticks=(-60:10:60, string.(-60:10:60)))
    qplot!(BTS, color=:black, hide=:nodes)
    xlims!(-0.5, 0.5)
    ylims!(-2, 2)
    display(fig)    
    #save(path*"BST.png", fig)
end
begin
    fig = Figure(size=(600,500))
    ax = Axis(fig[1,1], ylabel=L"ϵ\text{ (meV)}", xlabel=L"k \text{ (nm)}^{-1}", xlabelsize=20, ylabelsize=20, xticks=([-π, -π/2, 0, π/2, π], ["-π", "-π/2", "0", "π/2", "π"]), yticks=(-60:10:60, string.(-60:10:60)))
    record(fig, path*"BST.gif", eachindex(Vzs)) do iVz
        BTS = bands(hinf(;params..., Vz=Vzs[iVz]), ks)
        empty!(ax)   
        qplot!(BTS, color=:black, hide=:nodes)
        xlims!(-0.5, 0.5)
        ylims!(-2, 2)
    end
end

