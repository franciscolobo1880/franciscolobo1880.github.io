function Nambufy!(ρ)
    ρℓ = MMatrix{4,4}(ρ)
    ρℓ[1:2, 3:4] .*= -1.0
    ρℓ[3:4, 1:2] .*= -1.0
    ρℓ[3:4, 3:4] .= -transpose(ρℓ[SA[1,2],SA[1,2]])
    return SMatrix(ρℓ)
end

HFBfy!(::Missing, i) = 0*I
HFBfy!(ρ, i) = HFBfy!(ρ[i])
function HFBfy!(ρ)
    ρℓ = Nambufy!(ρ)
    return 0.5*tr(ρℓ * σ0τz)*σ0τz - 0.5*σ0τz - ρℓ
end

function NambuEncoder(h)
    s = h[1,1], h[2,2], h[2,1], h[4,1]
    return Quantica.tupleflatten(reim.(s)...)
end

function NambuDecoder(s)
    a = s[1]+im*s[2] #h0_11
    b = s[3]+im*s[4] #h0_22
    c = s[5]+im*s[6] #h0_21
    d = s[7]+im*s[8] #Δ_11
    h = SA[a conj(c) 0 conj(d); c b -d 0; 0 -conj(d) -a -c; d 0 -conj(c) -b]
    return h
end

function hρh!(s, s0, (Sf, GS, params))
    h = deserialize!(Sf, s0; params...)
    ρ = densitymatrix(greenfunction(h, GS)[])()
    serialize!(s, Sf; ρ, params...)
    return s
end

function fixedpoint(Sf, GS; m=3, maxit=150, beta=1, atol=1e-7, params...)
    s0 = serialize(Sf; params..., Δ0=2, Δ0_SM=0.01)
    sol = aasol(hρh!, s0, m, rand(length(s0), 3m+3); pdata=(Sf, GS, NamedTuple(params)), maxit, beta, atol)
    sol.errcode == 0 || println("`aasol` unsuccessful at $params")
    return (; s=sol.solution, i=length(sol.history), e=last(sol.history))
end

function selfconsistency(fixedpoint, xs, ys)
    seis = @showprogress pmap(xy -> fixedpoint(xy[1], xy[2]), Iterators.product(xs, ys))
    sers = (x -> x.s).(seis)
    errs = (x -> x.e).(seis)
    its = (x -> x.i).(seis)
    return sers, its, errs
end
